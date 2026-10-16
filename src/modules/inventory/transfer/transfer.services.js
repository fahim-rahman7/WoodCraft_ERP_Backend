import mongoose from "mongoose";
import { AppError } from "../../../utils/appError.js";
import { Item } from "../item/item.model.js";
import { Batch } from "../batch/batch.model.js"; // Batch model import
import { Stock } from "../stock/stock.model.js";
import { Warehouse } from "../warehouse/warehouse.model.js";
import { Transfer } from "./transfer.model.js";
import {
  releaseReservedStock,
  reserveStock,
  transferStock,
} from "../stock/stock.service.js";

// -----create new transfer
export const createNewTransferServices = async (
  organizationId,
  userId,
  payload,
) => {
  const { fromWarehouseId, toWarehouseId, items, remarks } = payload;

  // ----checking from and destination warehouse same or not
  if (fromWarehouseId === toWarehouseId) {
    throw new AppError(
      "Source and destination warehouses cannot be the same",
      400,
    );
  }

  // ----checking from warehouse exist or not
  const fromWarehouseExist = await Warehouse.findOne({
    _id: fromWarehouseId,
    organizationId,
    status: "ACTIVE",
  });
  if (!fromWarehouseExist) {
    throw new AppError("Source warehouse not found", 404);
  }

  // ----checking destination warehouse exist or not
  const destinationWarehouseExist = await Warehouse.findOne({
    _id: toWarehouseId,
    organizationId,
    status: "ACTIVE",
  });
  if (!destinationWarehouseExist) {
    throw new AppError("Destination warehouse not found", 404);
  }

  // ----checking every item and batch exist & available in stock
  for (const item of items) {
    const itemExist = await Item.findOne({
      _id: item.itemId,
      organizationId,
      status: "ACTIVE",
    });
    if (!itemExist) {
      throw new AppError("Item not found", 404);
    }
    console.log("DEBUGGING BATCH SEARCH:", {
      batchId: item.batchId,
      batchIdType: typeof item.batchId,
      organizationId,
    });

    // Validate Batch existence
    const batchExist = await Batch.findOne({
      _id: item.batchId,
      organizationId,
      // itemId: item.itemId,
      // status: "ACTIVE",
    });
    console.log("BATCH FIND RESULT:", batchExist);
    if (!batchExist) {
      throw new AppError("Batch not found or inactive", 404);
    }

    // ----checking item stock exist on from warehouse with specific batchId
    const stockExist = await Stock.findOne({
      organizationId,
      itemId: item.itemId,
      warehouseId: fromWarehouseId,
      batchId: item.batchId, // Checked by batchId
    });

    if (!stockExist) {
      throw new AppError(
        "This item with the specified batch is not available in the source warehouse",
        400,
      );
    }

    // -----checking item quantity
    if (stockExist.availableQuantity < item.quantity) {
      throw new AppError(
        `Not enough stock in this batch. Available: ${stockExist.availableQuantity}`,
        400,
      );
    }
  }

  // ----transfer number generate
  const lastTransfer = await Transfer.findOne({ organizationId })
    .sort({ createdAt: -1 })
    .select("transferNumber");

  const lastNumber = lastTransfer
    ? parseInt(lastTransfer.transferNumber.split("-")[1])
    : 0;
  const transferNumber = `TRF-${String(lastNumber + 1).padStart(4, "0")}`;

  // -----create transfer
  const transfer = await Transfer.create({
    organizationId,
    transferNumber,
    fromWarehouseId,
    toWarehouseId,
    items,
    remarks,
    requestedBy: userId,
  });

  return transfer;
};

// -----get all transfer with filter
export const getAllTransferServices = async (organizationId, query) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const filter = { organizationId };

  if (query.status) filter.status = query.status;
  if (query.fromWarehouseId) filter.fromWarehouseId = query.fromWarehouseId;
  if (query.toWarehouseId) filter.toWarehouseId = query.toWarehouseId;
  if (query.itemId) filter["items.itemId"] = query.itemId;
  if (query.batchId) filter["items.batchId"] = query.batchId; // 🆕 Filter by batchId

  const transfers = await Transfer.find(filter)
    .populate("fromWarehouseId", "name code")
    .populate("toWarehouseId", "name code")
    .populate("items.itemId", "name sku unit")
    .populate("items.batchId", "batchNumber status") // Populate batch info
    .populate("requestedBy", "name email")
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);

  const totalTransferCount = await Transfer.countDocuments(filter);
  const totalPage = Math.ceil(totalTransferCount / limit);

  return {
    data: transfers,
    meta: {
      page,
      limit,
      totalPage,
      totalTransferCount,
    },
  };
};

// -----get single transfer
export const getSingleTransferServices = async (trnasferId, organizationId) => {
  const transferData = await Transfer.findOne({
    _id: trnasferId,
    organizationId,
  })
    .populate("fromWarehouseId", "name code")
    .populate("toWarehouseId", "name code")
    .populate("items.itemId", "name sku unit")
    .populate("items.batchId", "batchNumber status") // Populate batch info
    .populate("requestedBy", "name email");

  if (!transferData) {
    throw new AppError("No data found", 404);
  }

  return transferData;
};

// ------approve transfer
export const approveTransferServices = async (
  trnasferId,
  organizationId,
  userId,
) => {
  const approveTransfer = await mongoose.connection.transaction(
    async (session) => {
      const transferData = await Transfer.findOne({
        _id: trnasferId,
        organizationId,
      }).session(session);

      if (!transferData) {
        throw new AppError("No data found", 404);
      }

      if (transferData.status !== "PENDING") {
        throw new AppError(
          `Only pending transfer can be approved. Current status: ${transferData.status}`,
          400,
        );
      }

      // ------reserving transferable stock with batchId
      for (const item of transferData.items) {
        await reserveStock(
          {
            organizationId,
            warehouseId: transferData.fromWarehouseId,
            itemId: item.itemId,
            batchId: item.batchId, // Pass batchId
            quantity: item.quantity,
            referenceType: "STOCK_TRANSFER",
            referenceId: transferData._id,
            performedBy: userId,
            remarks: `Stock reserved for transfer ${transferData.transferNumber}`,
          },
          session,
        );
      }

      transferData.status = "APPROVED";
      transferData.approvedBy = userId;
      await transferData.save({ session });

      return transferData;
    },
  );

  return approveTransfer;
};

// ------complete transfer Services
export const completeTransferServices = async (
  trnasferId,
  organizationId,
  userId,
) => {
  const completeTransfer = await mongoose.connection.transaction(
    async (session) => {
      const transferData = await Transfer.findOne({
        _id: trnasferId,
        organizationId,
      }).session(session);

      if (!transferData) {
        throw new AppError("No data found", 404);
      }

      if (transferData.status !== "APPROVED") {
        throw new AppError(
          `Only Approved transfer can be Completed. Current status: ${transferData.status}`,
          400,
        );
      }

      // ------releasing reserved stock with batchId
      for (const item of transferData.items) {
        await releaseReservedStock(
          {
            organizationId,
            warehouseId: transferData.fromWarehouseId,
            itemId: item.itemId,
            batchId: item.batchId, // 🆕 Pass batchId
            quantity: item.quantity,
            performedBy: userId,
            referenceType: "STOCK_TRANSFER",
            referenceId: transferData._id,
            remarks: `Reserved Stock Released for transfer ${transferData.transferNumber}`,
          },
          session,
        );
      }

      // -----transferring stock from warehouse to warehouse with batchId
      for (const item of transferData.items) {
        await transferStock(
          {
            organizationId,
            fromWarehouseId: transferData.fromWarehouseId,
            toWarehouseId: transferData.toWarehouseId,
            itemId: item.itemId,
            batchId: item.batchId, // Pass batchId
            quantity: item.quantity,
            referenceId: transferData._id,
            performedBy: userId,
            remarks: `Stock Transfer done for transfer ${transferData.transferNumber}`,
          },
          session,
        );
      }

      transferData.status = "COMPLETED";
      await transferData.save({ session });

      return transferData;
    },
  );

  return completeTransfer;
};

// ------cancel transfer Services
export const cancelTransferServices = async (
  trnasferId,
  organizationId,
  userId,
) => {
  const cancelTransfer = await mongoose.connection.transaction(
    async (session) => {
      const transferData = await Transfer.findOne({
        _id: trnasferId,
        organizationId,
      }).session(session);

      if (!transferData) {
        throw new AppError("No data found", 404);
      }

      if (
        transferData.status !== "APPROVED" &&
        transferData.status !== "PENDING"
      ) {
        throw new AppError(
          `Only Approved or Pending transfer can be Cancelled. Current status: ${transferData.status}`,
          400,
        );
      }

      // ------releasing reserved stock if reserved with batchId
      if (transferData.status === "APPROVED") {
        for (const item of transferData.items) {
          await releaseReservedStock(
            {
              organizationId,
              warehouseId: transferData.fromWarehouseId,
              itemId: item.itemId,
              batchId: item.batchId, // Pass batchId
              quantity: item.quantity,
              performedBy: userId,
              referenceType: "STOCK_TRANSFER",
              referenceId: transferData._id,
              remarks: `Reserved Stock Released for transfer ${transferData.transferNumber}`,
            },
            session,
          );
        }
      }

      transferData.status = "CANCELLED";
      await transferData.save({ session });

      return transferData;
    },
  );

  return cancelTransfer;
};