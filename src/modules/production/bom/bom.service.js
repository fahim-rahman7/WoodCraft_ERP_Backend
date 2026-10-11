import { AppError } from "../../../utils/appError.js";
import { Item } from "../../inventory/item/item.model.js";
import { BOM } from "./bom.model.js";

// ----- Create BOM
export const createBOMService = async (organizationId, userId, payload) => {
  const { finishedItemId, components, quantity, remarks } = payload;

  // Check if finished item exists
  const finishedItemExist = await Item.findOne({
    _id: finishedItemId,
    organizationId,
    status: "ACTIVE",
  });
  if (!finishedItemExist) {
    throw new AppError("Finished item not found or inactive", 404);
  }

  // Check if all component items exist and aren't the finished item itself
  for (const component of components) {
    if (component.itemId === finishedItemId) {
      throw new AppError("A product cannot be a component of itself", 400);
    }
    const itemExist = await Item.findOne({
      _id: component.itemId,
      organizationId,
      status: "ACTIVE",
    });
    if (!itemExist) {
      throw new AppError(`Component item not found with ID: ${component.itemId}`, 404);
    }
  }

  // Generate BOM Number (e.g., BOM-0001)
  const lastBOM = await BOM.findOne({ organizationId })
    .sort({ createdAt: -1 })
    .select("bomNumber");

  const lastNumber = lastBOM ? parseInt(lastBOM.bomNumber.split("-")[1]) : 0;
  const bomNumber = `BOM-${String(lastNumber + 1).padStart(4, "0")}`;

  try {
    const bom = await BOM.create({
      organizationId,
      bomNumber,
      finishedItemId,
      quantity,
      components,
      remarks,
      createdBy: userId,
    });
    return bom;
  } catch (error) {
    if (error.code === 11000) throw new AppError("Duplicate BOM detected, please try again", 409);
    throw error;
  }
};

// ----- Get All BOMs
export const getAllBOMsService = async (organizationId, query) => {
  const { status, finishedItemId, page, limit } = query;
  const skip = (page - 1) * limit;

  const filter = { organizationId };
  if (status) filter.status = status;
  if (finishedItemId) filter.finishedItemId = finishedItemId;

  const [boms, total] = await Promise.all([
    BOM.find(filter)
      .populate("finishedItemId", "name code unit")
      .populate("components.itemId", "name code unit category")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BOM.countDocuments(filter),
  ]);

  return {
    data: boms,
    meta: {
      page,
      limit,
      totalPage: Math.ceil(total / limit),
      totalData: total,
    },
  };
};

// ----- Get Single BOM
export const getSingleBOMService = async (organizationId, bomId) => {
  const bom = await BOM.findOne({ _id: bomId, organizationId })
    .populate("finishedItemId", "name code unit")
    .populate("components.itemId", "name code unit category")
    .populate("createdBy", "name")
    .lean();

  if (!bom) throw new AppError("BOM not found", 404);
  return bom;
};

// ----- Update BOM
export const updateBOMService = async (organizationId, bomId, payload) => {
  // If components are updated, validate them again
  if (payload.components) {
    const bom = await BOM.findOne({ _id: bomId, organizationId });
    if (!bom) throw new AppError("BOM not found", 404);

    for (const component of payload.components) {
      if (component.itemId === bom.finishedItemId.toString()) {
        throw new AppError("A product cannot be a component of itself", 400);
      }
      const itemExist = await Item.exists({ _id: component.itemId, organizationId, status: "ACTIVE" });
      if (!itemExist) throw new AppError(`Component item not found: ${component.itemId}`, 404);
    }
  }

  const updatedBOM = await BOM.findOneAndUpdate(
    { _id: bomId, organizationId },
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!updatedBOM) throw new AppError("BOM not found", 404);
  return updatedBOM;
};

// ----- Delete (Soft Delete) BOM
export const deleteBOMService = async (organizationId, bomId) => {
  const deletedBOM = await BOM.findOneAndUpdate(
    { _id: bomId, organizationId },
    { $set: { status: "INACTIVE" } },
    { new: true }
  );

  if (!deletedBOM) throw new AppError("BOM not found", 404);
  return deletedBOM;
};