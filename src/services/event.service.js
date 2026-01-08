const Event = require("../models/Event");
const Venue = require("../models/Venue");
const Category = require("../models/Category");
const { AppError } = require("../utils/AppError");

exports.getAllEvents = async (filter = {} /* , skip = 0, limit = 10 */) => {
  // return await Event.find(filter)
  //   .skip(skip)
  //   .limit(limit)
  //   .populate("createdBy", " firstName email");
  return await Event.find(filter)
    .populate("createdBy", " firstName email")
    .populate("venueId", "name address city capacity images description")
    .populate("categoryId", "name description");
};

exports.getAllFeaturedEvents = async () => {
  return await Event.find({ featured: true })
    .populate("createdBy", " firstName email")
    .populate("venueId", "name address city capacity images description")
    .populate("categoryId", "name description");
};
exports.getEventById = async (id) => {
  const event = await Event.findById(id)
    .populate("createdBy", " firstName email")
    .populate("venueId", "name address city capacity images description")
    .populate("categoryId", "name description");

  if (!event) {
    throw new AppError(
      "NotFoundError",
      "Event not found",
      "No event found with that ID",
      404
    );
  }
  return event;
};

exports.createEvent = async (eventData, adminId) => {
  if (eventData.venueId) {
    const venue = await Venue.findById(eventData.venueId);
    if (!venue) {
      throw new AppError(
        "NotFoundError",
        "Venue not found",
        "No venue found with that ID",
        404
      );
    }
  }

  if (eventData.categoryId) {
    const category = await Category.findById(eventData.categoryId);
    if (!category) {
      throw new AppError(
        "NotFoundError",
        "Category not found",
        "No category found with that ID",
        404
      );
    }
  }

  const event = await Event.create({
    ...eventData,
    createdBy: adminId,
  });

  if (!event) {
    throw new AppError(
      "ValidationError",
      "Event not created",
      "No event created with that ID",
      404
    );
  }
  return event;
};

exports.updateEvent = async (id, updateData) => {
  if (updateData.venueId) {
    const venue = await Venue.findById(updateData.venueId);
    if (!venue) {
      throw new AppError(
        "NotFoundError",
        "Venue not found",
        "No venue found with that ID",
        404
      );
    }
  }

  if (updateData.categoryId) {
    const category = await Category.findById(updateData.categoryId);
    if (!category) {
      throw new AppError(
        "NotFoundError",
        "Category not found",
        "No category found with that ID",
        404
      );
    }
  }

  const event = await Event.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("createdBy", " firstName email");

  if (!event) {
    throw new AppError(
      "NotFoundError",
      "Event not found",
      "No event found with that ID",
      404
    );
  }
  return event;
};

exports.deleteEvent = async (id) => {
  const event = await Event.findByIdAndDelete(id);
  if (!event) {
    throw new AppError(
      "NotFoundError",
      "Event not found",
      "No event found with that ID",
      404
    );
  }
  return event;
};

exports.updateEventStatus = async (id, status) => {
  if (!status) {
    throw new AppError(
      "ValidationError",
      "Status required",
      "Please provide a status to update",
      400
    );
  }
  const event = await Event.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).populate("createdBy", " firstName email");

  if (!event) {
    throw new AppError(
      "NotFoundError",
      "Event not found",
      "No event found with that ID",
      404
    );
  }
  return event;
};
