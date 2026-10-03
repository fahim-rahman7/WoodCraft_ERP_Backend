import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { createNewTransferServices } from "./transfer.services.js";



// -----create new transfer
export const createNewTransfer = asyncHandler(async(req, res)=>{
    const transfer = await createNewTransferServices(req.organizationId, req.user.id, req.body)

    new ApiResponse(201, 'Warehouse transfer request created successfully', transfer).send(res)
})
