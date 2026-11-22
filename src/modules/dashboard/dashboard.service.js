import mongoose from 'mongoose';
import { Organization } from '../organization/organization.model.js';
import { Membership } from '../membership/membership.model.js';
import { Invitation } from '../invitation/invitation.model.js';
import { Stock } from '../inventory/stock/stock.model.js';
import { WorkOrder } from '../production/workOrder/workOrder.model.js';
import { Wip } from '../production/workorderinprogress/wip.model.js';
import { PurchaseOrder } from '../procurement/purchase/purchase.model.js';
import { Supplier } from '../procurement/supplier/supplier.model.js';
import { StockMovement } from '../inventory/stockMovement/stockMovement.model.js';

// ==================== 1. OWNER DASHBOARD SERVICE ====================
export const getOwnerDashboardData = async (organizationId) => {
  const orgObjectId = new mongoose.Types.ObjectId(organizationId);

  // 1. Organization & Subscription Info
  const organization = await Organization.findById(organizationId).select(
    'name subscriptionPlan subscriptionStatus settings'
  );

  // 2. Financial & Stock Metrics (Total stock count / quantities)
  const stockMetrics = await Stock.aggregate([
    { $match: { organizationId: orgObjectId } },
    {
      $group: {
        _id: null,
        totalInventoryStock: { $sum: '$availableQuantity' },
        totalReservedStock: { $sum: '$reservedQuantity' },
      },
    },
  ]);

  // Total completed production count from Work Orders
  const completedWorkOrders = await WorkOrder.countDocuments({
    organizationId,
    status: 'COMPLETED',
  });

  // 3. Team & Organization Stats
  const activeMembersCount = await Membership.countDocuments({
    organizationId,
    status: 'ACTIVE',
  });

  const pendingInvitationsCount = await Invitation.countDocuments({
    organizationId,
    status: 'PENDING',
  });

  return {
    subscription: {
      plan: organization?.subscriptionPlan || 'PRO',
      status: organization?.subscriptionStatus || 'ACTIVE',
    },
    metrics: {
      totalInventoryStock: stockMetrics[0]?.totalInventoryStock || 0,
      totalReservedStock: stockMetrics[0]?.totalReservedStock || 0,
      completedWorkOrders,
    },
    teamStats: {
      activeMembersCount,
      pendingInvitationsCount,
    },
    organizationDetails: organization,
  };
};

// ==================== 2. MANAGER DASHBOARD SERVICE ====================
export const getManagerDashboardData = async (organizationId) => {
  // 1. Production & WIP Tracking
  const activeWorkOrders = await WorkOrder.find({
    organizationId,
    status: { $in: ['PENDING', 'IN_PROGRESS'] },
  }).limit(5);

  const wipSummary = await Wip.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalQuantityIn: { $sum: '$quantityIn' },
        totalCompleted: { $sum: '$quantityCompleted' },
      },
    },
  ]);

  // 2. Inventory & Warehouse Alerts (Low stock simulation or threshold check)
  const lowStockItems = await Stock.find({
    organizationId,
    availableQuantity: { $lte: 10 }, // Threshold example
  })
    .populate('itemId', 'name sku')
    .populate('warehouseId', 'name code')
    .limit(5);

  const recentMovements = await StockMovement.find({ organizationId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('itemId', 'name');

  // 3. Procurement Overview
  const recentPurchaseOrders = await PurchaseOrder.find({ organizationId })
    .sort({ createdAt: -1 })
    .limit(5);

  const activeSuppliersCount = await Supplier.countDocuments({
    organizationId,
    status: 'ACTIVE',
  });

  return {
    production: {
      activeWorkOrders,
      wipSummary,
    },
    inventoryAlerts: {
      lowStockItems,
      recentMovements,
    },
    procurement: {
      recentPurchaseOrders,
      activeSuppliersCount,
    },
  };
};

// ==================== 3. HR DASHBOARD SERVICE ====================
export const getHrDashboardData = async (organizationId) => {
  // 1. Team Directory & Member Stats by Role
  const members = await Membership.find({ organizationId, status: 'ACTIVE' })
    .populate('userId', 'name email')
    .select('role status userId createdAt');

  const roleBreakdown = members.reduce((acc, member) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {});

  // 2. Invitation Management
  const pendingInvitations = await Invitation.find({
    organizationId,
    status: 'PENDING',
  }).select('email role createdAt invitedBy');

  return {
    totalMembers: members.length,
    roleBreakdown,
    membersList: members,
    pendingInvitations,
  };
};