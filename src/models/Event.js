const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      required: false,
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    totalCapacity: {
      type: Number,
      required: true,
    },
    availableSeats: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    eventType: {
      type: String,
      enum: ["Online", "In-person", "Hybrid"],
      default: "In-person",
    },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "draft",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      immutable: true,
    },
    // tickets: [
    //   {
    //     type: {
    //       type: String,
    //       enum: ["General", "VIP", "VIP Gold", "VIP Platinum"],
    //       default: "General",
    //     },
    //     description: {
    //       type: String,
    //       required: true,
    //     },
    //     multiplier: {
    //       type: Number,
    //       required: true,
    //     },
    //   },
    // ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

eventSchema.pre(/^find/, async function (next) {
  // 1. Find all events that are 'published' but whose end date has passed
  // Note: We use the model directly to avoid an infinite loop
  await this.model.updateMany(
    {
      status: "published",
      endDateTime: { $lt: new Date() },
    },
    { status: "completed" },
  );
  next();
});

// // Indexing for faster queries
// eventSchema.index({ startDateTime: 1 });
module.exports = mongoose.model("Event", eventSchema);
