const bookingService = require("../services/booking.service.js");
const { catchError, AppError } = require("../utils/AppError");

const getAllBookings = catchError(async (req, res, next) => {
  const bookings = await bookingService.getAllBookings(req.query);
  if (!bookings || bookings.length === 0) {
    return next(new AppError("NotFoundError", "No bookings found", null, 404));
  }
  res.status(200).json({
    status: "success",
    count: bookings.length,
    data: { bookings },
  });
});

const getBookingById = catchError(async (req, res, next) => {
  const booking = await bookingService.getBookingById(req.params.id);
  if (!booking) {
    return next(new AppError("NotFoundError", "Booking not found", null, 404));
  }
  res.status(200).json({
    status: "success",
    data: { booking },
  });
});

const getBookingByReference = catchError(async (req, res, next) => {
  const booking = await bookingService.getBookingByReference(
    req.params.reference
  );
  if (!booking) {
    return next(new AppError("NotFoundError", "Booking not found", null, 404));
  }
  res.status(200).json({
    status: "success",
    data: { booking },
  });
});

const createBooking = catchError(async (req, res, next) => {
  const newBooking = await bookingService.createBooking(req.body);
  res.status(201).json({
    status: "success",
    data: { newBooking },
  });
});

const updateBooking = catchError(async (req, res, next) => {
  const updatedBooking = await bookingService.updateBooking(
    req.userId,
    req.params.id,
    req.body
  );
  if (!updatedBooking) {
    return next(new AppError("NotFoundError", "Booking not found", null, 404));
  }
  res.status(200).json({
    status: "success",
    data: { updatedBooking },
  });
});

const deleteBooking = catchError(async (req, res, next) => {
  const result = await bookingService.deleteBooking(req.userId, req.params.id);
  if (!result) {
    return next(new AppError("NotFoundError", "Booking not found", null, 404));
  }
  res.status(200).json({
    status: "success",
    message: "Booking deleted successfully",
  });
});

const getMyBookings = catchError(async (req, res, next) => {
  const bookings = await bookingService.getBookingsByUserId(req.userId);
  if (!bookings || bookings.length === 0) {
    return next(
      new AppError("NotFoundError", "You have no bookings yet", null, 404)
    );
  }
  res.status(200).json({
    status: "success",
    count: bookings.length,
    data: { bookings },
  });
});

const getBookingsByEventId = catchError(async (req, res, next) => {
  const bookings = await bookingService.getBookingsByEventId(
    req.params.eventId
  );
  if (!bookings || bookings.length === 0) {
    return next(
      new AppError(
        "NotFoundError",
        "No bookings found for this event",
        null,
        404
      )
    );
  }
  res.status(200).json({
    status: "success",
    count: bookings.length,
    data: { bookings },
  });
});

module.exports = {
  getAllBookings,
  getBookingById,
  getBookingByReference,
  createBooking,
  updateBooking,
  deleteBooking,
  getMyBookings,
  getBookingsByEventId,
};
