const eventService = require("../services/event.service");
const { catchError } = require("../utils/AppError");
const path = require("path");

exports.getAllEvents = catchError(async (req, res, next) => {
  const filter = {};
  if (req.query.venueId) filter.venueId = req.query.venueId;
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;
  if (req.query.featured) filter.featured = req.query.featured;
  if (req.query.ticketType) filter["tickets.type"] = req.query.ticketType;

  // const page = req.query.page * 1 || 1;
  // const limit = req.query.limit * 1 || 10;
  // const skip = (page - 1) * limit;

  // const events = await eventService.getAllEvents(filter, skip, limit);

  const events = await eventService.getAllEvents(filter);
  res.status(200).json({
    status: "success",
    results: events.length,
    data: { events },
  });
});

exports.getAllFeaturedEvents = catchError(async (req, res, next) => {
  const events = await eventService.getAllFeaturedEvents();
  res.status(200).json({
    status: "success",
    results: events.length,
    data: { events },
  });
});

exports.getEventById = catchError(async (req, res, next) => {
  const event = await eventService.getEventById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { event },
  });
});

exports.createEvent = catchError(async (req, res, next) => {
  let eventData = { ...req.body };
  if (req.files && req.files.length > 0) {
    eventData.images = req.files.map((file) =>
      path.join("uploads", file.filename).replace(/\\/g, "/")
    );
  }

  const event = await eventService.createEvent(eventData, req.adminId);
  res.status(201).json({
    status: "success",
    data: { event },
  });
});

exports.updateEvent = catchError(async (req, res, next) => {
  let eventData = { ...req.body };
  if (req.files && req.files.length > 0) {
    eventData.images = req.files.map((file) =>
      path.join("uploads", file.filename).replace(/\\/g, "/")
    );
  }

  const event = await eventService.updateEvent(req.params.id, eventData);
  res.status(200).json({
    status: "success",
    data: { event },
  });
});

exports.deleteEvent = catchError(async (req, res, next) => {
  await eventService.deleteEvent(req.params.id);
  res.status(200).json({
    status: "success",
    data: null,
    message: "Event deleted successfully",
  });
});

exports.updateEventStatus = catchError(async (req, res, next) => {
  const event = await eventService.updateEventStatus(
    req.params.id,
    req.body.status
  );
  res.status(200).json({
    status: "success",
    data: { event },
  });
});
