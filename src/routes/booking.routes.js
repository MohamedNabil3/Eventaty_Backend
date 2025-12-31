const Router = require("express");
const bookingController = require("../controllers/booking.controller.js");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");

const bookingRouter = Router();

bookingRouter.get("/", requireAdmin, bookingController.getAllBookings);
bookingRouter.get("/my", requireAuth, bookingController.getMyBookings);
bookingRouter.get(
  "/reference/:reference",
  requireAuth,
  bookingController.getBookingByReference
);

bookingRouter.post("/", requireAuth, bookingController.createBooking);

bookingRouter
  .route("/:id")
  .get(requireAuth, bookingController.getBookingById)
  .put(requireAuth, bookingController.updateBooking)
  .delete(requireAuth, bookingController.deleteBooking);

bookingRouter.get(
  "/event/:eventId",
  requireAdmin,
  bookingController.getBookingsByEventId
);

module.exports = bookingRouter;
