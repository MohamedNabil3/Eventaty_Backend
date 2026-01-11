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

  // 1. Initial validation - find the event
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError("NotFoundError", "Event not found", null, 404);
  }

  // 2. Check if event is published
  if (event.status !== "published") {
    throw new AppError(
      "ValidationError",
      "Event is not available for booking",
      null,
      400
    );
  }

  // 3. ATOMIC DECREMENT: Only proceed if availableSeats >= seatsBooked
  // This is the critical step to prevent overbooking
  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventId,
      availableSeats: { $gte: seatsBooked },
    },
    {
      $inc: { availableSeats: -seatsBooked },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  // If updatedEvent is null, it means availableSeats was less than seatsBooked at the exact moment of execution
  if (!updatedEvent) {
    throw new AppError(
      "ValidationError",
      "Not enough seats available",
      { available: event.availableSeats },
      400
    );
  }

  // 4. Validate ticket type exists on the event
  const ticketInfo = event.tickets.find((t) => t.type === ticketType);
  if (!ticketInfo) {
    // ROLLBACK: Return the seats if ticket type is invalid
    await Event.findByIdAndUpdate(eventId, {
      $inc: { availableSeats: seatsBooked },
    });

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
    cancellationAllowed: !isLastMinuteBooking,
    status: "confirmed",
  });

  try {
    await newBooking.save();
  } catch (error) {
    // ROLLBACK: Return seats if booking fails to save (e.g. database error)
    await Event.findByIdAndUpdate(eventId, {
      $inc: { availableSeats: seatsBooked },
    });
    throw error;
  }

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

  // 2. Atomic Cancellation logic
  if (data.status === "cancelled" && booking.status !== "cancelled") {
    if (!booking.cancellationAllowed) {
      throw new AppError(
        "ValidationError",
        "This booking is non-refundable and cannot be cancelled",
        null,
        400
      );
    }

    if (new Date() > booking.cancellationDeadline) {
      throw new AppError(
        "ValidationError",
        "The cancellation deadline for this booking has passed",
        null,
        400
      );
    }

    // Return seats to event inventory atomically
    await Event.findByIdAndUpdate(booking.eventId, {
      $inc: { availableSeats: booking.seatsBooked },
    });
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

  // If we delete an active booking, return seats to the event inventory atomically
  if (booking.status !== "cancelled") {
    await Event.findByIdAndUpdate(booking.eventId, {
      $inc: { availableSeats: booking.seatsBooked },
    });
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
