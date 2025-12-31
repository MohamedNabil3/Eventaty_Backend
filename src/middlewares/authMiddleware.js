const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const User = require("../models/User");
const { AppError } = require("../utils/AppError");

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(
      new AppError(
        "AuthenticationError",
        "No token provided",
        "Authorization header missing or invalid",
        401
      )
    );
  }

  const token = header.split(" ")[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        return next(
          new AppError(
            "AuthenticationError",
            "Invalid token",
            "Token verification failed",
            401
          )
        );
      }
      req.userId = decodedToken.id;
      return next();
    });
  } else {
    return next(
      new AppError(
        "AuthenticationError",
        "No token provided",
        "Token not found in header",
        401
      )
    );
  }
};

const requireAdmin = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(
      new AppError(
        "AuthenticationError",
        "No token provided",
        "Authorization header missing or invalid",
        401
      )
    );
  }

  const token = header.split(" ")[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        return next(
          new AppError(
            "AuthenticationError",
            "Invalid token",
            "Token verification failed",
            401
          )
        );
      }

      req.userId = decodedToken.id;
      const user = await User.findById(req.userId);
      if (!user) {
        return next(
          new AppError(
            "NotFoundError",
            "User not found",
            "Token belongs to a user that no longer exists",
            401
          )
        );
      }
      if (user.role !== "admin") {
        return next(
          new AppError(
            "AuthorizationError",
            "Forbidden",
            "You are not authorized to do this action",
            403
          )
        );
      }
      req.adminId = user._id;
      return next();
    });
  } else {
    return next(
      new AppError(
        "AuthenticationError",
        "No token provided",
        "Token not found in header",
        401
      )
    );
  }
};
module.exports = { requireAuth, requireAdmin };
