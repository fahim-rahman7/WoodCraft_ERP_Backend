import mongoose from "mongoose"
import { AppError } from "../../../utils/appError.js"
import { Item } from "../item/item.model.js"
import { Stock } from "../stock/stock.model.js"
import { Warehouse } from "../warehouse/warehouse.model.js"
import { Transfer } from "./transfer.model.js"
import { reserveStock } from "../stock/stock.service.js"


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



// -----get all transfer with filter
export const getAllTransferServices = async(organizationId, query)=>{

    const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt"
    const sortOrder = query.sortOrder === "asc" ? 1 : -1

    // ----filter object
    const filter = { organizationId }

    // -----filter object data add
    if(query.status) filter.status = query.status
    if(query.fromWarehouseId) filter.fromWarehouseId = query.fromWarehouseId
    if(query.toWarehouseId) filter.toWarehouseId = query.toWarehouseId
    if(query.itemId) filter["items.itemId"] = query.itemId
    


    const transfers = await Transfer.find(filter)
        .populate("fromWarehouseId", "name code")
        .populate("toWarehouseId", "name code")
        .populate("items.itemId", "name sku unit")
        .populate("requestedBy", "name email")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)

    
    const totalTransferCount = await Transfer.countDocuments(filter)
    const totalPage = Math.ceil(totalTransferCount/limit)

    return {
        data: transfers,
        meta:{
            page, 
            limit, 
            totalPage,
            totalTransferCount
        }
    }
}


// -----get single transfer
export const getSingleTransferServices = async(trnasferId, organizationId)=>{

    // ----getting transfer data
    const transferData = await Transfer.findOne({
        _id: trnasferId,
        organizationId
    }).populate("fromWarehouseId", "name code")
        .populate("toWarehouseId", "name code")
        .populate("items.itemId", "name sku unit")
        .populate("requestedBy", "name email")

    if(!transferData){
        throw new AppError("No data found", 404)
    }

    return transferData
}



// ------approve transfer
export const approveTransferServices = async(trnasferId, organizationId, userId)=>{

    // ------applying logic inside of a transaction
    const approveTransfer = await mongoose.connection.transaction(async(session)=>{


        // ----getting transfer data
        const transferData = await Transfer.findOne({
            _id: trnasferId,
            organizationId
        }).session(session)
    
        if(!transferData){
            throw new AppError("No data found", 404)
        }
    
        if(transferData.status !== "PENDING"){
        throw new AppError(`Only pending transfer can be approved. Current status: ${transferData.status}`, 400)
    }
    



        // ------reserrving transferable stock

        for(const item of transferData.items){
            await reserveStock({
                organizationId,
                warehouseId: transferData.fromWarehouseId,
                itemId: item.itemId,
                quantity: item.quantity,
                referenceType: 'STOCK_TRANSFER',
                referenceId: transferData._id,
                performedBy: userId,
                remarks: `Stock reserved for transfer ${transferData.transferNumber}`
            }, session)
        }

        // -----update data 
        transferData.status = "APPROVED"
        transferData.approvedBy = userId
        await transferData.save({session})

        return transferData
    })

    return approveTransfer
}
