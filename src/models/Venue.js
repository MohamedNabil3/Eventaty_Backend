const mongoose = require("mongoose");

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      required: false,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

venueSchema.virtual("events", {
  ref: "Event",
  localField: "_id",
  foreignField: "venueId",
});

venueSchema.set("toObject", { virtuals: true });
venueSchema.set("toJSON", { virtuals: true });

const Venue = mongoose.model("Venue", venueSchema);

module.exports = Venue;
