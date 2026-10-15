import mongoose from "mongoose";
import { AppError } from "../../../utils/appError.js";
import { Item } from "../item/item.model.js";
import { Batch } from "../batch/batch.model.js"; // 🆕 Batch model import
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

    // 🆕 ----checking batch exist and active
    const batchExist = await Batch.findOne({
      _id: item.batchId,
      organizationId,
      itemId: item.itemId,
      warehouseId,
      status: "ACTIVE",
    });
    if (!batchExist) {
      throw new AppError(`Active batch not found for item ID: ${item.itemId}`, 404);
    }

    // -----getting current stock of this item & batch in this warehouse
    const stockExist = await Stock.findOne({
      organizationId,
      warehouseId,
      itemId: item.itemId,
      batchId: item.batchId, // 🆕 Filtered by batchId
    });
    const systemQuantity = stockExist ? stockExist.quantity : 0;

    // -----difference = physical - system
    const difference = Number(
      (item.physicalQuantity - systemQuantity).toFixed(4),
    );

    adjustmentItems.push({
      itemId: item.itemId,
      batchId: item.batchId, // 🆕 Included batchId
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

  // ----adjustment number generate
  const lastAdjustment = await Adjustment.findOne({ organizationId })
    .sort({ createdAt: -1 })
    .select("adjustmentNumber");

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

  const filter = { organizationId };

  if (query.status) filter.status = query.status;
  if (query.reason) filter.reason = query.reason;
  if (query.warehouseId) filter.warehouseId = query.warehouseId;
  if (query.itemId) filter["items.itemId"] = query.itemId;
  if (query.batchId) filter["items.batchId"] = query.batchId; // 🆕 Filter by batchId

  const adjustments = await Adjustment.find(filter)
    .populate("warehouseId", "name code")
    .populate("items.itemId", "name sku unit")
    .populate("items.batchId", "batchNumber status") // 🆕 Populate batch info
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
  const adjustmentData = await Adjustment.findOne({
    _id: adjustmentId,
    organizationId,
  })
    .populate("warehouseId", "name code location")
    .populate("items.itemId", "name sku unit")
    .populate("items.batchId", "batchNumber status") // 🆕 Populate batch info
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
  const adjustmentData = await Adjustment.findOne({
    _id: adjustmentId,
    organizationId,
  });

  if (!adjustmentData) {
    throw new AppError("Adjustment not found", 404);
  }

  if (adjustmentData.status !== "PENDING") {
    throw new AppError(
      `Only pending adjustment can be approved. Current status: ${adjustmentData.status}`,
      400,
    );
  }

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
  const adjustmentData = await Adjustment.findOne({
    _id: adjustmentId,
    organizationId,
  });

  if (!adjustmentData) {
    throw new AppError("Adjustment not found", 404);
  }

  if (
    adjustmentData.status !== "PENDING" &&
    adjustmentData.status !== "APPROVED"
  ) {
    throw new AppError(
      `Only pending or approved adjustment can be cancelled. Current status: ${adjustmentData.status}`,
      400,
    );
  }

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
  const applyAdjustment = await mongoose.connection.transaction(
    async (session) => {
      const adjustmentData = await Adjustment.findOne({
        _id: adjustmentId,
        organizationId,
      }).session(session);

      if (!adjustmentData) {
        throw new AppError("Adjustment not found", 404);
      }

      const warehouseExist = await Warehouse.findOne({
        _id: adjustmentData.warehouseId,
        organizationId,
        status: "ACTIVE",
      }).session(session);

      if (!warehouseExist) {
        throw new AppError("Warehouse not found", 404);
      }

      for (const item of adjustmentData.items) {
        const itemExist = await Item.findOne({
          _id: item.itemId,
          organizationId,
          status: "ACTIVE",
        }).session(session);
        
        if (!itemExist) {
          throw new AppError(`Item not found: ${item.itemId}`, 404);
        }

        // 🆕 Check batch existence during apply
        const batchExist = await Batch.findOne({
          _id: item.batchId,
          organizationId,
          status: "ACTIVE",
        }).session(session);

        if (!batchExist) {
          throw new AppError(`Batch not found or inactive: ${item.batchId}`, 404);
        }
      }

      if (adjustmentData.status !== "APPROVED") {
        throw new AppError(
          `Only approved adjustment can be applied. Current status: ${adjustmentData.status}`,
          400,
        );
      }

      // ------updating stock of every item with batchId
      for (const item of adjustmentData.items) {
        if (item.difference === 0) continue;

        const stockData = {
          organizationId,
          warehouseId: adjustmentData.warehouseId,
          itemId: item.itemId,
          batchId: item.batchId, // 🆕 Pass batchId to stock service
          quantity: Math.abs(item.difference),
          referenceType: "STOCK_ADJUSTMENT",
          referenceId: adjustmentData._id,
          performedBy: userId,
          remarks: `Stock adjusted for ${adjustmentData.adjustmentNumber} (${adjustmentData.reason})`,
        };

        if (item.difference > 0) {
          await increaseStock(stockData, session);
        }

        if (item.difference < 0) {
          await decreaseStock(stockData, session);
        }
      }

      adjustmentData.status = "APPLIED";
      await adjustmentData.save({ session });

      return adjustmentData;
    },
  );

  return applyAdjustment;
};