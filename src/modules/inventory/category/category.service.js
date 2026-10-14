import { Category } from "./category.model.js";
import { Item } from "../item/item.model.js";
import { AppError } from "../../../utils/appError.js";

export const createCategoryService = async (organizationId, payload) => {
  const { name, description, status } = payload;

  // Duplicate name check (case-insensitive)
  const existingCategory = await Category.findOne({
    organizationId,
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });

  if (existingCategory) {
    throw new AppError("Category with this name already exists", 400);
  }

  const category = await Category.create({
    organizationId,
    name,
    description,
    status,
  });

  return category;
};

export const getAllCategoriesService = async (organizationId, query) => {
  const filter = { organizationId };

  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.name = { $regex: query.search, $options: "i" };
  }

  const categories = await Category.find(filter).sort({ createdAt: -1 });
  return categories;
};

export const getCategoryByIdService = async (categoryId, organizationId) => {
  const category = await Category.findOne({ _id: categoryId, organizationId });
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return category;
};

export const updateCategoryService = async (categoryId, organizationId, payload) => {
  const category = await Category.findOne({ _id: categoryId, organizationId });
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (payload.name && payload.name !== category.name) {
    const existingCategory = await Category.findOne({
      organizationId,
      name: { $regex: new RegExp(`^${payload.name}$`, "i") },
      _id: { $ne: categoryId },
    });
    if (existingCategory) {
      throw new AppError("Category with this name already exists", 400);
    }
  }

  Object.assign(category, payload);
  await category.save();
  return category;
};

export const deleteCategoryService = async (categoryId, organizationId) => {
  const category = await Category.findOne({ _id: categoryId, organizationId });
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  // Check if items are associated with this category
  const itemsCount = await Item.countDocuments({ categoryId, organizationId });
  if (itemsCount > 0) {
    throw new AppError(
      `Cannot delete category. It is associated with ${itemsCount} items.`,
      400
    );
  }

  await Category.deleteOne({ _id: categoryId });
  return { message: "Category deleted successfully" };
};