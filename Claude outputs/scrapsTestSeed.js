// -----scraps test data seed
// run from project root: node scrapsTestSeed.js
import "dotenv/config";
import mongoose from "mongoose";
import { User } from "./src/modules/auth/auth.model.js";
import { Membership } from "./src/modules/membership/membership.model.js";
import { Organization } from "./src/modules/organization/organization.model.js";
import { Category } from "./src/modules/inventory/category/category.model.js";
import { Supplier } from "./src/modules/inventory/supplier/supplier.model.js";
import { Warehouse } from "./src/modules/inventory/warehouse/warehouse.model.js";
import { Item } from "./src/modules/inventory/item/item.model.js";
import { Batch } from "./src/modules/inventory/batch/batch.model.js";
import { Stock } from "./src/modules/inventory/stock/stock.model.js";
import { increaseStock } from "./src/modules/inventory/stock/stock.service.js";

// -----your login email
const EMAIL = "shantotest@gmail.com";

// -----if you have more than one organization put the id here
const ORGANIZATION_ID = "";

// -----find one doc, create if not exist
const findOrCreate = async (Model, filter, data) => {
  const exist = await Model.findOne(filter);
  if (exist) return exist;
  return Model.create({ ...filter, ...data });
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  // ----checking user exist or not
  const user = await User.findOne({ email: EMAIL });
  if (!user) throw new Error(`User not found: ${EMAIL}`);

  // ----finding your organization
  const memberships = await Membership.find({ userId: user._id, status: "ACTIVE" });
  if (memberships.length === 0) throw new Error("You are not member of any organization");

  let membership = memberships[0];
  if (ORGANIZATION_ID) {
    membership = memberships.find((m) => m.organizationId.toString() === ORGANIZATION_ID);
    if (!membership) throw new Error("You are not member of this organization");
  } else if (memberships.length > 1) {
    console.log("You have more than one organization. Put one id in ORGANIZATION_ID:");
    for (const m of memberships) {
      const org = await Organization.findById(m.organizationId);
      console.log(`  ${m.organizationId}  ${org?.name}  (${m.role})`);
    }
    return;
  }

  const organizationId = membership.organizationId;
  const organization = await Organization.findById(organizationId);
  console.log(`Organization: ${organization?.name} (${organizationId})`);

  // -----category
  const category = await findOrCreate(
    Category,
    { organizationId, name: "Scrap Test Wood" },
    { description: "Test category for scraps", status: "ACTIVE" },
  );

  // -----supplier
  const supplier = await findOrCreate(
    Supplier,
    { organizationId, name: "Scrap Test Timber" },
    { phone: "01700000001", address: "Dhaka", status: "ACTIVE" },
  );

  // -----warehouse
  const warehouse = await findOrCreate(
    Warehouse,
    { organizationId, code: "SCR-WH-01" },
    { name: "Scrap Test Warehouse", location: "Dhaka", status: "ACTIVE" },
  );

  // -----items
  const teak = await findOrCreate(
    Item,
    { organizationId, sku: "SCR-TEAK-01" },
    { categoryId: category._id, name: "Teak Wood (Scrap Test)", unit: "CFT", itemType: "RAW_MATERIAL", status: "ACTIVE" },
  );
  const mahogany = await findOrCreate(
    Item,
    { organizationId, sku: "SCR-MAHO-01" },
    { categoryId: category._id, name: "Mahogany Wood (Scrap Test)", unit: "CFT", itemType: "RAW_MATERIAL", status: "ACTIVE" },
  );

  // -----batches with stock quantity
  const batchList = [
    { batchNumber: "SCR-BATCH-001", item: teak, quantity: 100 },
    { batchNumber: "SCR-BATCH-002", item: teak, quantity: 60 },
    { batchNumber: "SCR-BATCH-003", item: mahogany, quantity: 50 },
  ];

  const result = [];

  for (const b of batchList) {
    const batch = await findOrCreate(
      Batch,
      { organizationId, batchNumber: b.batchNumber },
      {
        itemId: b.item._id,
        supplierId: supplier._id,
        warehouseId: warehouse._id,
        initialQuantity: b.quantity,
        currentQuantity: b.quantity,
        status: "ACTIVE",
      },
    );

    // ----add stock only first time
    const stockExist = await Stock.findOne({
      organizationId,
      warehouseId: warehouse._id,
      itemId: b.item._id,
      batchId: batch._id,
    });

    if (!stockExist) {
      await increaseStock({
        organizationId,
        warehouseId: warehouse._id,
        itemId: b.item._id,
        batchId: batch._id,
        quantity: b.quantity,
        referenceType: "INITIAL_STOCK",
        referenceId: batch._id,
        performedBy: user._id,
        remarks: "Scrap test initial stock",
      });
    }

    const stock = await Stock.findOne({
      organizationId,
      warehouseId: warehouse._id,
      itemId: b.item._id,
      batchId: batch._id,
    });

    result.push({
      item: b.item.name,
      itemId: b.item._id.toString(),
      batchNumber: batch.batchNumber,
      batchId: batch._id.toString(),
      availableQuantity: stock.availableQuantity,
    });
  }

  console.log("\norganizationId :", organizationId.toString());
  console.log("warehouseId    :", warehouse._id.toString());
  console.log("supplierId     :", supplier._id.toString());
  console.table(result);

  // -----postman body for create scraps
  const body = {
    warehouseId: warehouse._id.toString(),
    items: [
      { itemId: result[0].itemId, batchId: result[0].batchId, quantity: 5, reason: "DAMAGE" },
      { itemId: result[2].itemId, batchId: result[2].batchId, quantity: 2, reason: "OFFCUT" },
    ],
    remarks: "Scrap test",
  };
  console.log("\nPostman body (POST /inventory/scraps):");
  console.log(JSON.stringify(body, null, 2));
};

run()
  .catch((error) => console.error("Seed error:", error.message))
  .finally(() => mongoose.disconnect());
