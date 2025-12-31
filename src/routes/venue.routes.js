const express = require("express");
const venueRouter = express.Router();
const venueController = require("../controllers/venue.controller");
const { requireAdmin } = require("../middlewares/authMiddleware");

// Public routes
venueRouter.get("/", venueController.getAllVenues);
venueRouter.get("/:id", venueController.getVenueById);

// Admin only routes
venueRouter.post("/", requireAdmin, venueController.createVenue);
venueRouter.put("/:id", requireAdmin, venueController.updateVenue);
venueRouter.delete("/:id", requireAdmin, venueController.deleteVenue);

module.exports = venueRouter;
