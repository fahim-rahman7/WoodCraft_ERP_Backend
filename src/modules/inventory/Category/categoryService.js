import { AppError } from "../../../utils/appError.js";
import { Category } from "./categoryModel.js";

const DUPLICATE_MSG = "A category with this name already exists in your organization";
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createCategory = async (organizationId, data) => {
  try {
    return await Category.create({ ...data, organizationId });
  } catch (error) {
    if (error.code === 11000) throw new AppError(DUPLICATE_MSG, 409);
    throw error;
  }
};

export const getCategories = async (organizationId, query) => {
  const { status, search, page, limit } = query;
  const filter = { organizationId };
  if (status) filter.status = status;
  if (search) filter.name = { $regex: escapeRegex(search), $options: "i" };

  const [items, total] = await Promise.all([
    Category.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Category.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getCategoryById = async (organizationId, id) => {
  const category = await Category.findOne({ _id: id, organizationId }).lean();
  if (!category) throw new AppError("Category not found", 404);
  return category;
};

export const updateCategory = async (organizationId, id, data) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!category) throw new AppError("Category not found", 404);
    return category;
  } catch (error) {
    if (error.code === 11000) throw new AppError(DUPLICATE_MSG, 409);
    throw error;
  }
};

export const deleteCategory = async (organizationId, id) => {
  const category = await Category.findOneAndUpdate(
    { _id: id, organizationId },
    { $set: { status: "inactive" } },
    { new: true, runValidators: true },
  );
  if (!category) throw new AppError("Category not found", 404);
  return category;
};
