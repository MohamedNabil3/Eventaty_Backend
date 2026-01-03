const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    ticketType: {
      type: String,
      enum: ["General", "VIP"],
      default: "General",
      required: true,
    },
    seatsBooked: {
      type: Number,
      required: true,
      min: [1, "Seats booked cannot be less than 1"],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    cancellationAllowed: {
      type: Boolean,
      default: true,
    },
    cancellationDeadline: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexing for faster queries
// BookingSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model("Booking", BookingSchema);
