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

  const bookings = await Booking.find(query)
    .populate("userId", "firstName lastName email phone")
    .populate("eventId", "title description images startDateTime endDateTime")
    .sort({ createdAt: -1 });

  if (!bookings || bookings.length === 0) {
    throw new AppError("NotFoundError", "No bookings found", null, 404);
  }

  return bookings;
};

const getBookingById = async (id) => {
  const booking = await Booking.findById(id)
    .populate("userId", "firstName lastName email phone")
    .populate("eventId", "title description images startDateTime endDateTime");

  if (!booking) {
    throw new AppError("NotFoundError", "Booking not found", null, 404);
  }

  return booking;
};

const getBookingByReference = async (reference) => {
  const booking = await Booking.findOne({
    bookingReference: reference.toUpperCase(),
  })
    .populate("userId", "firstName lastName email phone")
    .populate("eventId", "title description images startDateTime endDateTime");

  if (!booking) {
    throw new AppError("NotFoundError", "Booking not found", null, 404);
  }

  return booking;
};

const getBookingsByUserId = async (userId) => {
  const bookings = await Booking.find({ userId })
    .populate("userId", "firstName lastName email phone")
    .populate({
      path: "eventId",
      select: "title description images startDateTime endDateTime venueId",
      populate: { path: "venueId", select: "address city country" },
    })
    .sort({ createdAt: -1 });

  if (!bookings || bookings.length === 0) {
    throw new AppError("NotFoundError", "You have no bookings yet", null, 404);
  }

  // Attach populated venue under `eventId.venue` for easier access (event.venue.address)
  const result = bookings.map((b) => {
    const obj = b.toObject();
    if (obj.eventId && obj.eventId.venueId) {
      obj.eventId.venue = obj.eventId.venueId;
      delete obj.eventId.venueId;
    }
    return obj;
  });

  return result;
};

const createBooking = async (userId, data) => {
  const { eventId, seatsBooked, ticketType = "General" } = data;

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

  // Find the ticket configuration for the selected type
  const ticketInfo = event.tickets.find((t) => t.type === ticketType);
  if (!ticketInfo) {
    throw new AppError(
      "ValidationError",
      `Ticket type '${ticketType}' is not available for this event`,
      null,
      400
    );
  }

  const totalAmount = event.price * ticketInfo.multiplier * seatsBooked;
  const bookingReference = generateBookingReference();

  // Calculate cancellation deadline (24h before event starts)
  const cancellationDeadline = new Date(event.startDateTime);
  cancellationDeadline.setHours(cancellationDeadline.getHours() - 24);

  // Check if we are already within that 24h window (Last-minute booking)
  const isLastMinuteBooking = cancellationDeadline <= new Date();

  const newBooking = new Booking({
    eventId,
    userId,
    ticketType,
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
    throw new AppError("NotFoundError", "Booking not found", null, 404);
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
    throw new AppError("NotFoundError", "Booking not found", null, 404);
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
  const bookings = await Booking.find({ eventId })
    .populate("userId", "firstName lastName email phone") // Don't send passwords
    .sort({ createdAt: -1 });

  if (!bookings || bookings.length === 0) {
    throw new AppError(
      "NotFoundError",
      "No bookings found for this event",
      null,
      404
    );
  }

  return bookings;
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
