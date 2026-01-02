const Booking = require("../models/Booking");
const Event = require("../models/Event");
const { AppError } = require("../utils/AppError");
const crypto = require("crypto");

const generateBookingReference = () => {
  const randomChars = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `BR-${randomChars}`;
};

const getAllBookings = async (filters = {}) => {
  const query = {};
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: start, $lte: end };
  }

  return await Booking.find(query)
    .populate("userId", "firstName lastName email phone")
    .populate("eventId", "title description images startDateTime endDateTime")
    .sort({ createdAt: -1 });
};

const getBookingById = async (id) => {
  return await Booking.findById(id)
    .populate("userId", "firstName lastName email phone")
    .populate("eventId", "title description images startDateTime endDateTime");
};

const getBookingByReference = async (reference) => {
  return await Booking.findOne({
    bookingReference: reference.toUpperCase(),
  })
    .populate("userId", "firstName lastName email phone")
    .populate("eventId", "title description images startDateTime endDateTime");
};

const getBookingsByUserId = async (userId) => {
  return await Booking.find({ userId })
    .populate("userId", "firstName lastName email phone")
    .populate("eventId", "title description images startDateTime endDateTime")
    .sort({ createdAt: -1 });
};

const createBooking = async (userId, data) => {
  const { eventId, seatsBooked } = data;

  // Find the event
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError("NotFoundError", "Event not found", null, 404);
  }

  // Check if event is published
  if (event.status !== "published") {
    throw new AppError(
      "ValidationError",
      "Event is not available for booking",
      null,
      400
    );
  }

  // Check seat availability
  if (event.availableSeats < seatsBooked) {
    throw new AppError(
      "ValidationError",
      "Not enough seats available",
      { available: event.availableSeats },
      400
    );
  }

  const totalAmount = event.price * seatsBooked;
  const bookingReference = generateBookingReference();

  // Calculate cancellation deadline (24h before event starts)
  const cancellationDeadline = new Date(event.startDateTime);
  cancellationDeadline.setHours(cancellationDeadline.getHours() - 24);

  // Check if we are already within that 24h window (Last-minute booking)
  const isLastMinuteBooking = cancellationDeadline <= new Date();

  const newBooking = new Booking({
    eventId,
    userId,
    seatsBooked,
    bookingReference,
    totalAmount,
    cancellationDeadline,
    cancellationAllowed: !isLastMinuteBooking, // Block cancellation for last-minute bookings
    status: "confirmed", // Set to confirmed immediately if payment is handled elsewhere
  });

  await newBooking.save();

  // Atomically decrease available seats in Event
  event.availableSeats -= seatsBooked;
  await event.save();

  return newBooking;
};

const updateBooking = async (userId, bookingId, data) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return null;
  }

  if (booking.userId != userId) {
    throw new AppError(
      "Unauthorized",
      "You are not authorized to update this booking",
      null,
      401
    );
  }

  // 1. Security check: Don't allow updating sensitive fields
  const forbiddenFields = [
    "totalAmount",
    "bookingReference",
    "userId",
    "eventId",
    "seatsBooked",
  ];
  forbiddenFields.forEach((field) => delete data[field]);

  // 2. Cancellation logic
  if (data.status === "cancelled" && booking.status !== "cancelled") {
    // Check if the booking was record as non-cancellable
    if (!booking.cancellationAllowed) {
      throw new AppError(
        "ValidationError",
        "This booking is non-refundable and cannot be cancelled",
        null,
        400
      );
    }

    // Check if current time is past the deadline
    if (new Date() > booking.cancellationDeadline) {
      throw new AppError(
        "ValidationError",
        "The cancellation deadline for this booking has passed",
        null,
        400
      );
    }

    // Return seats to event
    const event = await Event.findById(booking.eventId);
    if (event) {
      event.availableSeats += booking.seatsBooked;
      await event.save();
    }
  }

  const updated = await Booking.findByIdAndUpdate(bookingId, data, {
    new: true,
    runValidators: true,
  })
    .populate("userId", "firstName lastName email phone")
    .populate("eventId", "title description images startDateTime endDateTime");

  return updated;
};

const deleteBooking = async (userId, bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return false;
  }

  if (booking.userId != userId) {
    throw new AppError(
      "Unauthorized",
      "You are not authorized to delete this booking",
      null,
      401
    );
  }

  // If we delete an active booking, return seats to the event inventory
  if (booking.status !== "cancelled") {
    const event = await Event.findById(booking.eventId);
    if (event) {
      event.availableSeats += booking.seatsBooked;
      await event.save();
    }
  }

  await Booking.findByIdAndDelete(bookingId);
  return true;
};

const getBookingsByEventId = async (eventId) => {
  return await Booking.find({ eventId })
    .populate("userId", "firstName lastName email phone") // Don't send passwords
    .sort({ createdAt: -1 });
};

module.exports = {
  getAllBookings,
  getBookingById,
  getBookingByReference,
  createBooking,
  updateBooking,
  deleteBooking,
  getBookingsByUserId,
  getBookingsByEventId,
};
