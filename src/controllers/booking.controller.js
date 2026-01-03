const bookingService = require("../services/booking.service.js");
const { catchError, AppError } = require("../utils/AppError");

const getAllBookings = catchError(async (req, res, next) => {
  const bookings = await bookingService.getAllBookings(req.query);
  res.status(200).json({
    status: "success",
    count: bookings.length,
    data: { bookings },
  });
});

const getBookingById = catchError(async (req, res, next) => {
  const booking = await bookingService.getBookingById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { booking },
  });
});

const getBookingByReference = catchError(async (req, res, next) => {
  const booking = await bookingService.getBookingByReference(
    req.params.reference
  );
  res.status(200).json({
    status: "success",
    data: { booking },
  });
});

const createBooking = catchError(async (req, res, next) => {
  const newBooking = await bookingService.createBooking(req.userId, req.body);
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
  res.status(200).json({
    status: "success",
    data: { updatedBooking },
  });
});

const deleteBooking = catchError(async (req, res, next) => {
  await bookingService.deleteBooking(req.userId, req.params.id);
  res.status(200).json({
    status: "success",
    message: "Booking deleted successfully",
  });
});

const getMyBookings = catchError(async (req, res, next) => {
  const bookings = await bookingService.getBookingsByUserId(req.userId);
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
