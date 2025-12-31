const { AppError } = require("../utils/AppError");

// This is the "Emergency Department"
// It receives all errors (err) that happened anywhere in the app
module.exports = (err, req, res, next) => {
  // 1. Set default values if they are missing
  err.statusCode = err.statusCode || 500; // 500 = Server Error (unknown problem)
  err.message = err.message || "Internal Server Error";

  // 2. Handle specific database errors (Mongoose)

  // Case A: Duplicate Key (e.g., Email already exists)
  // Error code 11000 means "Duplicate Key" in MongoDB
  if (
    err.code === 11000 ||
    (err.name === "MongoServerError" && err.code === 11000)
  ) {
    const message = "Duplicate field value entered";
    // err.keyValue holds the field that was duplicated
    err = new AppError("DuplicateKeyError", message, err.keyValue, 400);
  }

  // Case B: Validation Error (e.g., Password too short, missing name)
  if (err.name === "ValidationError") {
    // If it's Mongoose, use "Invalid input data", otherwise keep the custom message
    const message = err.errors ? "Invalid input data" : err.message;

    // Check if it's a Mongoose validation error (has errors object)
    const details = err.errors
      ? Object.values(err.errors).map((el) => el.message)
      : err.details;
    err = new AppError("ValidationError", message, details, 400);
  }

  // Case C: Cast Error (e.g., Invalid ID format like "123" instead of ObjectId)
  if (err.name === "CastError") {
    const message = `Invalid ${err.path}: ${err.value}`;
    err = new AppError("CastError", message, "Invalid ID format", 400);
  }

  // 3. Send the final response to the user
  res.status(err.statusCode).json({
    status: `${err.statusCode}`.startsWith("4")
      ? "client-error"
      : "server-error",
    statusCode: err.statusCode,
    message: err.message,
    details: err.details,
  });
};
