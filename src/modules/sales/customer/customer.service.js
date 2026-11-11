import { Customer } from './customer.model.js';

// Helper to generate unique human-readable customer code
const generateCustomerCode = async (organizationId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Customer.countDocuments({ organizationId });
  const paddedSeq = String(count + 1).padStart(4, '0');
  return `CUST-${dateStr}-${paddedSeq}`;
};

export const createCustomerService = async (organizationId, userId, payload) => {
  let customerCode = payload.customerCode;

// যদি ক্লায়েন্ট কোড না পাঠায়, তবে ব্যাকএন্ড অটো জেনারেট করবে
if (!customerCode) {
  customerCode = await generateCustomerCode(organizationId);
} else {
  // যদি ক্লায়েন্ট নিজে পাঠায়, তবে চেক করব অর্গানাইজেশনে এটি ইউনিক আছে কিনা
  const existing = await Customer.findOne({
    organizationId,
    customerCode,
  });

  if (existing) {
    const error = new Error(`Customer with code '${customerCode}' already exists.`);
    error.statusCode = 400;
    throw error;
  }
}

  const customer = await Customer.create({
    ...payload,
    customerCode,
    organizationId,
    createdBy: userId,
  });

  return customer;
};

export const getCustomersService = async (organizationId, query = {}) => {
  const { search, status, page = 1, limit = 10 } = query;
  const filter = { organizationId };

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { customerCode: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [customers, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Customer.countDocuments(filter),
  ]);

  return {
    customers,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCustomerByIdService = async (organizationId, customerId) => {
  const customer = await Customer.findOne({ _id: customerId, organizationId });
  if (!customer) {
    const error = new Error('Customer not found in this organization.');
    error.statusCode = 404;
    throw error;
  }
  return customer;
};

export const updateCustomerService = async (organizationId, customerId, payload) => {
  const customer = await Customer.findOne({ _id: customerId, organizationId });
  if (!customer) {
    const error = new Error('Customer not found in this organization.');
    error.statusCode = 404;
    throw error;
  }

  if (payload.customerCode && payload.customerCode !== customer.customerCode) {
    const existing = await Customer.findOne({
      organizationId,
      customerCode: payload.customerCode,
    });
    if (existing) {
      const error = new Error(`Customer with code '${payload.customerCode}' already exists.`);
      error.statusCode = 400;
      throw error;
    }
  }

  Object.assign(customer, payload);
  await customer.save();
  return customer;
};