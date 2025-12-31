const Venue = require("../models/Venue");
const { AppError } = require("../utils/AppError");

exports.getAllVenues = async () => {
  return await Venue.find().select("-createdAt -updatedAt");
};

exports.getVenueById = async (id, filters = {}) => {
  let match = {};
  if (filters.date) {
    match.startDateTime = filters.date;
  }

  const venue = await Venue.findById(id).populate({
    path: "events",
    match: match,
    options: { sort: { startDateTime: 1 } },
  });
  if (!venue) {
    throw new AppError(
      "NotFoundError",
      "Venue not found",
      "No venue found with that ID",
      404
    );
  }
  return venue;
};

exports.createVenue = async (venueData) => {
  const venue = await Venue.create(venueData);
  if (!venue) {
    throw new AppError(
      "InternalError",
      "Venue not created",
      "Venue not created",
      500
    );
  }
  return venue;
};

exports.updateVenue = async (id, updateData) => {
  const venue = await Venue.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!venue) {
    throw new AppError(
      "NotFoundError",
      "Venue not found",
      "No venue found with that ID",
      404
    );
  }
  return venue;
};

exports.deleteVenue = async (id) => {
  const venue = await Venue.findByIdAndDelete(id);
  if (!venue) {
    throw new AppError(
      "NotFoundError",
      "Venue not found",
      "No venue found with that ID",
      404
    );
  }
  return venue;
};
