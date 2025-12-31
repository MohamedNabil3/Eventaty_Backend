const Category = require("../models/Category");
const { AppError } = require("../utils/AppError");

exports.getAllCategories = async () => {
  return await Category.find().select("-createdAt -updatedAt");
};

exports.getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError(
      "NotFoundError",
      "Category not found",
      "No category found with that ID",
      404
    );
  }
  return category;
};

exports.createCategory = async (categoryData) => {
  const category = await Category.create(categoryData);
  if (!category) {
    throw new AppError(
      "InternalError",
      "Category not created",
      "Category not created",
      500
    );
  }
  return category;
};

exports.updateCategory = async (id, updateData) => {
  const category = await Category.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    throw new AppError(
      "NotFoundError",
      "Category not found",
      "No category found with that ID",
      404
    );
  }
  return category;
};

exports.deleteCategory = async (id) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new AppError(
      "NotFoundError",
      "Category not found",
      "No category found with that ID",
      404
    );
  }
  return category;
};
