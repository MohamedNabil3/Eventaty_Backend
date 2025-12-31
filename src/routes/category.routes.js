const express = require("express");
const categoryRouter = express.Router();
const categoryController = require("../controllers/category.controller");
const { requireAdmin } = require("../middlewares/authMiddleware");

// Public routes
categoryRouter.get("/", categoryController.getAllCategories);
categoryRouter.get("/:id", categoryController.getCategoryById);

// Admin only routes
categoryRouter.post("/", requireAdmin, categoryController.createCategory);
categoryRouter.put("/:id", requireAdmin, categoryController.updateCategory);
categoryRouter.delete("/:id", requireAdmin, categoryController.deleteCategory);

module.exports = categoryRouter;
