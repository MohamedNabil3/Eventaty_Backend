const express = require("express");
const cors = require("cors");
const appRoutes = require("./src/routes/app.routes");
const connectDB = require("./DB");
const { AppError } = require("./src/utils/AppError");
const globalErrorHandler = require("./src/controllers/error.controller");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
// Serve static files from 'src/uploads' directory
app.use("/uploads", express.static("src/uploads"));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);

      app.use(appRoutes);

      // 404 Handler for undefined routes
      app.use((req, res, next) => {
        next(
          new AppError(
            "NotFoundError",
            "Page not found",
            "the page you are looking for does not exist",
            404
          )
        );
      });

      // Global Error Handler
      app.use(globalErrorHandler);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

startServer();
