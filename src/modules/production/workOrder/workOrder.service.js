import mongoose from 'mongoose';
import {
    AppError
} from '../../../utils/appError.js';
import {
    WorkOrder
} from './workOrder.model.js';
import {
    ProductionOrder
} from '../productionOrder/productionOrder.model.js';

const generateWorkOrderNumber = async (organizationId) => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await WorkOrder.countDocuments({
        organizationId
    });
    const sequence = String(count + 1).padStart(4, '0');
    return `WO-${dateStr}-${sequence}`;
};

export const createWorkOrder = async (organizationId, userId, payload) => {
    // 1. Check if referenced Production Order exists
    const prodOrder = await ProductionOrder.findOne({
        _id: payload.productionOrderId,
        organizationId,
    });
    if (!prodOrder) {
        throw new AppError('Production Order not found', 404);
    }

    // 2. Check if Production Order is in active production
    if (prodOrder.status !== 'IN_PRODUCTION') {
        throw new AppError(`Cannot create Work Order for a ${prodOrder.status.toLowerCase()} Production Order`, 400);
    }

    // 3. Check if single Work Order quantity exceeds Production Order target quantity
    if (payload.targetQuantity > prodOrder.targetQuantity) {
        throw new AppError(
            `Work Order target quantity (${payload.targetQuantity}) cannot exceed Production Order target quantity (${prodOrder.targetQuantity})`,
            400
        );
    }

    // 🆕 4. Calculate total accumulated target quantity of existing active Work Orders for this Production Order
    const existingWorkOrders = await WorkOrder.find({
        productionOrderId: payload.productionOrderId,
        organizationId,
        status: { $ne: 'CANCELLED' }, // Cancelled গুলে বাদ দিয়ে বাকি সব active/pending/in-progress/completed ধরবে
    });

    const totalExistingQuantity = existingWorkOrders.reduce(
        (sum, wo) => sum + wo.targetQuantity,
        0
    );

    const accumulatedQuantity = totalExistingQuantity + payload.targetQuantity;

    // 5. Check if total accumulated quantity exceeds Production Order target quantity
    if (accumulatedQuantity > prodOrder.targetQuantity) {
        throw new AppError(
            `Total accumulated Work Order quantity (${accumulatedQuantity}) exceeds Production Order target quantity (${prodOrder.targetQuantity}). Already allocated: ${totalExistingQuantity}`,
            400
        );
    }

    const workOrderNumber = await generateWorkOrderNumber(organizationId);

    const workOrder = await WorkOrder.create({
        organizationId,
        workOrderNumber,
        productionOrderId: payload.productionOrderId,
        operationName: payload.operationName,
        sequence: payload.sequence || 1,
        targetQuantity: payload.targetQuantity,
        assignedTo: payload.assignedTo,
        startDate: payload.startDate,
        remarks: payload.remarks,
        createdBy: userId,
        status: 'PENDING',
    });

    return workOrder;
};

export const getWorkOrders = async (organizationId, query = {}) => {
    const filter = {
        organizationId
    };
    if (query.status) filter.status = query.status;
    if (query.productionOrderId) filter.productionOrderId = query.productionOrderId;
    if (query.search) {
        filter.$or = [{
            workOrderNumber: {
                $regex: query.search,
                $options: 'i'
            }
        }, {
            operationName: {
                $regex: query.search,
                $options: 'i'
            }
        }];
    }

    return await WorkOrder.find(filter)
        .populate('productionOrderId', 'orderNumber targetQuantity status')
        .populate('assignedTo', 'name email')
        .sort({
            createdAt: -1
        });
};

export const getWorkOrderById = async (organizationId, id) => {
    const workOrder = await WorkOrder.findOne({
            _id: id,
            organizationId
        })
        .populate('productionOrderId', 'orderNumber targetQuantity status targetItemId')
        .populate('assignedTo', 'name email');

    if (!workOrder) {
        throw new AppError('Work Order not found', 404);
    }
    return workOrder;
};

export const startWorkOrder = async (organizationId, id) => {
    const workOrder = await WorkOrder.findOne({
        _id: id,
        organizationId
    });
    if (!workOrder) throw new AppError('Work Order not found', 404);

    if (workOrder.status !== 'PENDING') {
        throw new AppError(`Cannot start Work Order with status '${workOrder.status}'`, 400);
    }

    workOrder.status = 'IN_PROGRESS';
    await workOrder.save();
    return workOrder;
};

export const updateWorkOrderProgress = async (organizationId, id, payload) => {
    const workOrder = await WorkOrder.findOne({
        _id: id,
        organizationId
    });
    if (!workOrder) throw new AppError('Work Order not found', 404);

    // 🆕 Mandatory Start Check: Cannot update progress if status is still PENDING
    if (workOrder.status === 'PENDING') {
        throw new AppError('Please start the work order before updating progress', 400);
    }

    if (workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED') {
        throw new AppError(`Cannot update progress for a '${workOrder.status}' Work Order`, 400);
    }

    // Calculate new total completed quantity incrementally
    const newTotalCompleted = workOrder.completedQuantity + payload.completedQuantity;

    // Check if total accumulated quantity exceeds target quantity
    if (newTotalCompleted > workOrder.targetQuantity) {
        throw new AppError(
            `Total completed quantity (${newTotalCompleted}) cannot exceed target quantity (${workOrder.targetQuantity}). Already completed: ${workOrder.completedQuantity}`, 
            400
        );
    }

    // Update completed quantity
    workOrder.completedQuantity = newTotalCompleted;

    // Handle Status & Dates automatically when target is reached
    if (newTotalCompleted === workOrder.targetQuantity) {
        workOrder.status = 'COMPLETED';
        workOrder.endDate = new Date();
    }

    await workOrder.save();
    return workOrder;
};

export const cancelWorkOrder = async (organizationId, id) => {
    const workOrder = await WorkOrder.findOne({
        _id: id,
        organizationId
    });
    if (!workOrder) throw new AppError('Work Order not found', 404);

    if (workOrder.status === 'COMPLETED') {
        throw new AppError('Cannot cancel a completed Work Order', 400);
    }

    workOrder.status = 'CANCELLED';
    await workOrder.save();
    return workOrder;
};