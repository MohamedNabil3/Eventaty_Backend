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
      enum: ["General", "VIP", "VIP Gold", "VIP Platinum"],
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

// Automated Status Update: Sync with Event completion
BookingSchema.pre(/^find/, async function (next) {
  try {
    const Event = mongoose.model("Event");

    // 1. Find all events that have already ended
    const finishedEvents = await Event.find({
      endDateTime: { $lt: new Date() },
    }).select("_id");

    if (finishedEvents.length > 0) {
      const finishedEventIds = finishedEvents.map((e) => e._id);

      // 2. Update any 'confirmed' bookings for these events to 'completed'
      // We use this.model to avoid triggering this hook recursively
      await this.model.updateMany(
        {
          eventId: { $in: finishedEventIds },
          status: "confirmed",
        },
        { status: "completed" }
      );
    }
  } catch (error) {
    console.error("Error in Booking pre-find hook:", error);
  }
  next();
});

// Indexing for faster queries
BookingSchema.index({ userId: 1, eventId: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ eventId: 1 });

module.exports = mongoose.model("Booking", BookingSchema);
