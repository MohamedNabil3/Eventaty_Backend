const categoryService = require("../services/category.service");
const { catchError } = require("../utils/AppError");

exports.getAllCategories = catchError(async (req, res, next) => {
  const categories = await categoryService.getAllCategories();
  res.status(200).json({
    status: "success",
    results: categories.length,
    data: { categories },
  });
});

exports.getCategoryById = catchError(async (req, res, next) => {
  const category = await categoryService.getCategoryById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { category },
  });
});

exports.createCategory = catchError(async (req, res, next) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json({
    status: "success",
    data: { category },
  });
});

exports.updateCategory = catchError(async (req, res, next) => {
  const category = await categoryService.updateCategory(
    req.params.id,
    req.body
  );
  res.status(200).json({
    status: "success",
    data: { category },
  });
});

exports.deleteCategory = catchError(async (req, res, next) => {
  await categoryService.deleteCategory(req.params.id);
  res.status(200).json({
    status: "success",
    data: null,
    message: "Category deleted successfully",
  });
});
