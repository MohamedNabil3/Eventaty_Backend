const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const expressMongoSanitize = require("express-mongo-sanitize");
const appRoutes = require("./src/routes/app.routes");
const connectDB = require("./DB");
const { AppError } = require("./src/utils/AppError");
const globalErrorHandler = require("./src/controllers/error.controller");
require("dotenv").config();

const app = express();

// --- 1. Security & Global Middlewares ---
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors());
app.use(express.json());
app.use(expressMongoSanitize()); // to make this library work fine with express, you need to downgrade your express version to v4
// because in express v5 you can only read req.params and req.query but not editing them like this library try to do

// Serve static files from 'src/uploads' directory
app.use("/uploads", express.static("src/uploads"));

app.use(appRoutes);

// 404 Handler for undefined routes
app.use((req, res, next) => {
  next(
    new AppError(
      "NotFoundError",
      "Page not found",
      "the page you are looking for does not exist",
      404,
    ),
  );
});

// Global Error Handler
app.use(globalErrorHandler);

// --- 4. Server Start ---
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

startServer();
