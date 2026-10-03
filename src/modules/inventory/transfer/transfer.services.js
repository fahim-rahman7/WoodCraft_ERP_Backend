import { AppError } from "../../../utils/appError.js"
import { Item } from "../item/item.model.js"
import { Stock } from "../stock/stock.model.js"
import { Warehouse } from "../warehouse/warehouse.model.js"
import { Transfer } from "./transfer.model.js"


// -----create new transfer
export const createNewTransferServices = async(organizationId, userId, payload)=>{
    const {fromWarehouseId, toWarehouseId, itemId, quantity, remarks} = payload

    // ----checking from and destination warehouse same or not
    if(fromWarehouseId === toWarehouseId){
        throw new AppError("Source and destination warehouses cannot be the same", 400)
    }

    // ----checking from warehouse exist or not
    const fromWarehouseExist = await Warehouse.findOne({ _id: fromWarehouseId, organizationId, status: "ACTIVE" })
    if(!fromWarehouseExist){
        throw new AppError("Source warehouse not found", 404)
    }

    // ----checking destination warehouse exist or not
    const destinationWarehouseExist = await Warehouse.findOne({ _id: toWarehouseId, organizationId, status: "ACTIVE" })
    if(!destinationWarehouseExist){
        throw new AppError("Destination warehouse not found", 404)
    }

    // -----checking item exist or not
    const itemExist = await Item.findOne({ _id: itemId, organizationId, status: "ACTIVE" })
    if(!itemExist){
        throw new AppError("Item not found", 404)
    }

    // ----checking item stock exist on from warehouse
    const stockExist = await Stock.findOne({
        organizationId,
        itemId,
        warehouseId: fromWarehouseId,
    })

    if(!stockExist){
        throw new AppError("This item is not available in the source warehouse", 400)
    }

    // -----checking item quantity
    if(stockExist.availableQuantity < quantity){
        throw new AppError(`Not enough stock. Available: ${stockExist.availableQuantity}`, 400)
    }

    //---- trnasfer number genarate
    // -----finding last transfer of this organization
    const lastTransfer = await Transfer.findOne({ organizationId })
        .sort({ createdAt: -1 })
        .select("transferNumber")

    // -----generate new transfer number (TRF-0001, TRF-0002 ...)
    const lastNumber = lastTransfer ? parseInt(lastTransfer.transferNumber.split("-")[1]) : 0
    const transferNumber = `TRF-${String(lastNumber + 1).padStart(4, "0")}`




    // -----create transfer
    const transfer = await Transfer.create({
        organizationId,
        transferNumber,
        fromWarehouseId,
        toWarehouseId,
        items: [{ itemId, quantity }],
        remarks,
        requestedBy: userId,
    })

    return transfer
}
