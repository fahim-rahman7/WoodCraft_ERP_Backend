import { AppError } from "../../../utils/appError.js";
import { Item } from "../item/item.model.js";
import { Batch } from "../batch/batch.model.js";
import { Stock } from "../stock/stock.model.js";
import { Warehouse } from "../warehouse/warehouse.model.js";
import { Scrap } from "./scraps.model.js";

// -----create new scraps
export const createScrapsServices = async (organizationId, userId, payload) => {
  const { warehouseId, items, remarks } = payload;

  // ----checking warehouse exist or not
  const warehouseExist = await Warehouse.findOne({
    _id: warehouseId,
    organizationId,
    status: "ACTIVE",
  });
  if (!warehouseExist) {
    throw new AppError("Warehouse not found", 404);
  }

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

    // ----checking batch exist and active
    const batchExist = await Batch.findOne({
      _id: item.batchId,
      organizationId,
      itemId: item.itemId,
      warehouseId,
      status: "ACTIVE",
    });
    if (!batchExist) {
      throw new AppError(`Active batch not found for item: ${item.itemId}`, 404);
    }

    // ----checking item stock exist on this warehouse & batch
    const stockExist = await Stock.findOne({
      organizationId,
      warehouseId,
      itemId: item.itemId,
      batchId: item.batchId,
    });
    if (!stockExist) {
      throw new AppError(`Stock not available for item: ${item.itemId}`, 400);
    }

    // -----checking item quantity
    if (stockExist.availableQuantity < item.quantity) {
      throw new AppError(`Not enough stock available for item: ${item.itemId}`, 400);
    }
  }

  // ----scrap number generate
  const lastScrap = await Scrap.findOne({ organizationId })
    .sort({ createdAt: -1 })
    .select("scrapNumber");

  const lastNumber = lastScrap ? parseInt(lastScrap.scrapNumber.split("-")[1]) : 0;
  const scrapNumber = `SCR-${String(lastNumber + 1).padStart(4, "0")}`;

  // -----create scraps
  const scrap = await Scrap.create({
    organizationId,
    scrapNumber,
    warehouseId,
    items,
    remarks,
    requestedBy: userId,
  });

  return scrap;
};
