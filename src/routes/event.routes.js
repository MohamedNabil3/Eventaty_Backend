const express = require("express");
const eventRouter = express.Router();
const eventController = require("../controllers/event.controller");
const { requireAdmin } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// Public routes
eventRouter.get("/", eventController.getAllEvents);
eventRouter.get("/featured", eventController.getAllFeaturedEvents);
eventRouter.get("/:id", eventController.getEventById);

// Admin only routes
eventRouter.post(
  "/",
  requireAdmin,
  upload.array("images", 5), // Allow up to 5 images
  eventController.createEvent
);
eventRouter.put(
  "/:id",
  requireAdmin,
  upload.array("images", 5),
  eventController.updateEvent
);
eventRouter.delete("/:id", requireAdmin, eventController.deleteEvent);
eventRouter.patch(
  "/:id/status",
  requireAdmin,
  eventController.updateEventStatus
);

module.exports = eventRouter;
