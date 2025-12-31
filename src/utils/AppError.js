// This class helps us organize error information.
// Instead of just saying "Error", we can save the HTTP status code (like 404) and specific details.
class AppError extends Error {
  constructor(name, message, details, statusCode) {
    super(message); // Calls the parent 'Error' class to set the main message

    this.name = name || "Error"; // The type of error (e.g., "NotFoundError")
    this.message = message; // A human-readable message (e.g., "User not found")
    this.details = details; // Extra info (e.g., "ID 123 is invalid")
    this.statusCode = statusCode || 500; // HTTP Code: 400 (Bad Request), 404 (Not Found), 500 (Server Error)
  }
}

const catchError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

module.exports = { catchError, AppError };
