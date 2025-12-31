const venueService = require("../services/venue.service");
const { catchError } = require("../utils/AppError");

exports.getAllVenues = catchError(async (req, res, next) => {
  const venues = await venueService.getAllVenues();
  res.status(200).json({
    status: "success",
    results: venues.length,
    data: { venues },
  });
});

exports.getVenueById = catchError(async (req, res, next) => {
  const venue = await venueService.getVenueById(req.params.id, req.query);
  res.status(200).json({
    status: "success",
    data: { venue },
  });
});

exports.createVenue = catchError(async (req, res, next) => {
  const venue = await venueService.createVenue(req.body);
  res.status(201).json({
    status: "success",
    data: { venue },
  });
});

exports.updateVenue = catchError(async (req, res, next) => {
  const venue = await venueService.updateVenue(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    data: { venue },
  });
});

exports.deleteVenue = catchError(async (req, res, next) => {
  await venueService.deleteVenue(req.params.id);
  res.status(200).json({
    status: "success",
    data: null,
    message: "Venue deleted successfully",
  });
});
