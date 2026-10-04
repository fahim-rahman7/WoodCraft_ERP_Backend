import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { createNewTransferServices, getAllTransferServices, getSingleTransferServices } from "./transfer.services.js";



// -----create new transfer
export const createNewTransfer = asyncHandler(async(req, res)=>{
    const transfer = await createNewTransferServices(req.organizationId, req.user.id, req.body)

    new ApiResponse(201, 'Warehouse transfer request created successfully', transfer).send(res)
})



// -----get all transfer with filter
export const getAllTransfer = asyncHandler(async(req, res)=>{
    const transfers = await getAllTransferServices(req.organizationId, req.query)

    new ApiResponse(200, 'All Transfers fetched successfully', transfers).send(res)
})



// -----get single transfer
export const getSingleTransfer = asyncHandler(async(req,res)=>{

    const transfer = await getSingleTransferServices(req.params.id, req.organizationId)

    new ApiResponse(200, 'Single Transfers fetched successfully', transfer).send(res)
})
