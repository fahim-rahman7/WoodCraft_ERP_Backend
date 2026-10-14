import mongoose from "mongoose";
import { AppError } from "../../../utils/appError.js";
import { Item } from "../item/item.model.js";
import { Stock } from "../stock/stock.model.js";
import { Warehouse } from "../warehouse/warehouse.model.js";
import { Adjustment } from "./adjustment.model.js";
import { decreaseStock, increaseStock } from "../stock/stock.service.js";

// -----create new adjustment
export const createAdjustmentServices = async (
  organizationId,
  userId,
  payload,
) => {
  const { warehouseId, items, reason, remarks } = payload;

  // ----checking warehouse exist or not
  const warehouseExist = await Warehouse.findOne({
    _id: warehouseId,
    organizationId,
    status: "ACTIVE",
  });
  if (!warehouseExist) {
    throw new AppError("Warehouse not found", 404);
  }

  // ----adjustment items with system quantity and difference
  const adjustmentItems = [];

  for (const item of items) {
    // -----checking item exist or not
    const itemExist = await Item.findOne({
      _id: item.itemId,
      organizationId,
      status: "ACTIVE",
    });
    if (!itemExist) {
      throw new AppError(`Item not found: ${item.itemId}`, 404);
    }

    // -----getting current stock of this item in this warehouse
    const stockExist = await Stock.findOne({
      organizationId,
      warehouseId,
      itemId: item.itemId,
    });
    const systemQuantity = stockExist ? stockExist.quantity : 0;

    // -----difference = physical - system (rounded to avoid decimal problem)
    const difference = Number(
      (item.physicalQuantity - systemQuantity).toFixed(4),
    );

    adjustmentItems.push({
      itemId: item.itemId,
      systemQuantity,
      physicalQuantity: item.physicalQuantity,
      difference,
    });
  }

  // ----checking at least one item has difference
  const hasDifference = adjustmentItems.some((item) => item.difference !== 0);
  if (!hasDifference) {
    throw new AppError(
      "Physical quantity matches system quantity for all items. Nothing to adjust",
      400,
    );
  }

  //---- adjustment number generate
  // -----finding last adjustment of this organization
  const lastAdjustment = await Adjustment.findOne({ organizationId })
    .sort({ createdAt: -1 })
    .select("adjustmentNumber");

  // -----generate new adjustment number (ADJ-0001, ADJ-0002 ...)
  const lastNumber = lastAdjustment
    ? parseInt(lastAdjustment.adjustmentNumber.split("-")[1])
    : 0;
  const adjustmentNumber = `ADJ-${String(lastNumber + 1).padStart(4, "0")}`;

  // -----create adjustment
  const adjustment = await Adjustment.create({
    organizationId,
    adjustmentNumber,
    warehouseId,
    items: adjustmentItems,
    reason,
    remarks,
    requestedBy: userId,
  });

  return adjustment;
};

// --------get adjustment list
export const adjustmentListServices = async (organizationId, query) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  // ----filter object
  const filter = { organizationId };

  // -----filter object data add
  if (query.status) filter.status = query.status;
  if (query.reason) filter.reason = query.reason;
  if (query.warehouseId) filter.warehouseId = query.warehouseId;
  if (query.itemId) filter["items.itemId"] = query.itemId;

  const adjustments = await Adjustment.find(filter)
    .populate("warehouseId", "name code")
    .populate("items.itemId", "name sku unit")
    .populate("requestedBy", "name email")
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);

  const totalAdjustmentCount = await Adjustment.countDocuments(filter);
  const totalPage = Math.ceil(totalAdjustmentCount / limit);

  return {
    data: adjustments,
    meta: {
      page,
      limit,
      totalPage,
      totalAdjustmentCount,
    },
  };
};

// --------get single adjustment
export const getSingleAdjustmentServices = async (
  adjustmentId,
  organizationId,
) => {
  // ----getting adjustment data of this organization
  const adjustmentData = await Adjustment.findOne({
    _id: adjustmentId,
    organizationId,
  })
    .populate("warehouseId", "name code location")
    .populate("items.itemId", "name sku unit")
    .populate("requestedBy", "name email")
    .populate("approvedBy", "name email");

  if (!adjustmentData) {
    throw new AppError("Adjustment not found", 404);
  }

  return adjustmentData;
};

// --------approve adjustment
export const approveAdjustmentServices = async (
  adjustmentId,
  organizationId,
  userId,
) => {
  // ----getting adjustment data of this organization
  const adjustmentData = await Adjustment.findOne({
    _id: adjustmentId,
    organizationId,
  });

  if (!adjustmentData) {
    throw new AppError("Adjustment not found", 404);
  }

  // ----only pending adjustment can be approved
  if (adjustmentData.status !== "PENDING") {
    throw new AppError(
      `Only pending adjustment can be approved. Current status: ${adjustmentData.status}`,
      400,
    );
  }

  // -----update data
  adjustmentData.status = "APPROVED";
  adjustmentData.approvedBy = userId;
  await adjustmentData.save();

  return adjustmentData;
};

// --------cancel adjustment
export const cancelAdjustmentServices = async (
  adjustmentId,
  organizationId,
) => {
  // ----getting adjustment data of this organization
  const adjustmentData = await Adjustment.findOne({
    _id: adjustmentId,
    organizationId,
  });

  if (!adjustmentData) {
    throw new AppError("Adjustment not found", 404);
  }

  // ----only pending or approved adjustment can be cancelled
  if (
    adjustmentData.status !== "PENDING" &&
    adjustmentData.status !== "APPROVED"
  ) {
    throw new AppError(
      `Only pending or approved adjustment can be cancelled. Current status: ${adjustmentData.status}`,
      400,
    );
  }

  // -----update data (no stock change, adjustment does not reserve stock)
  adjustmentData.status = "CANCELLED";
  await adjustmentData.save();

  return adjustmentData;
};

// -----apply adjustment
export const applyAdjustmentServices = async (
  adjustmentId,
  organizationId,
  userId,
) => {
  // ------applying logic inside of a transaction
  const applyAdjustment = await mongoose.connection.transaction(
    async (session) => {
      // ----getting adjustment data of this organization
      const adjustmentData = await Adjustment.findOne({
        _id: adjustmentId,
        organizationId,
      }).session(session);

      if (!adjustmentData) {
        throw new AppError("Adjustment not found", 404);
      }

      // ----only approved adjustment can be applied
      if (adjustmentData.status !== "APPROVED") {
        throw new AppError(
          `Only approved adjustment can be applied. Current status: ${adjustmentData.status}`,
          400,
        );
      }

      // ------updating stock of every item
      for (const item of adjustmentData.items) {
        // ----same quantity, nothing to change
        if (item.difference === 0) continue;

        const stockData = {
          organizationId,
          warehouseId: adjustmentData.warehouseId,
          itemId: item.itemId,
          quantity: Math.abs(item.difference),
          referenceType: "STOCK_ADJUSTMENT",
          referenceId: adjustmentData._id,
          performedBy: userId,
          remarks: `Stock adjusted for ${adjustmentData.adjustmentNumber} (${adjustmentData.reason})`,
        };

        // ----physical is more than system, increase stock
        if (item.difference > 0) {
          await increaseStock(stockData, session);
        }

        // ----physical is less than system, decrease stock
        if (item.difference < 0) {
          await decreaseStock(stockData, session);
        }
      }

      // -----update data
      adjustmentData.status = "APPLIED";
      await adjustmentData.save({ session });

      return adjustmentData;
    },
  );

  return applyAdjustment;
};
