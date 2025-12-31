const express = require("express");
const appRouter = express.Router();

const userRoutes = require("./user.routes");
const bookingRoutes = require("./booking.routes");
const eventRoutes = require("./event.routes");
const venueRoutes = require("./venue.routes");
const categoryRoutes = require("./category.routes");

appRouter.use("/auth", userRoutes);
appRouter.use("/bookings", bookingRoutes);
appRouter.use("/events", eventRoutes);
appRouter.use("/venues", venueRoutes);
appRouter.use("/categories", categoryRoutes);

module.exports = appRouter;
