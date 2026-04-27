"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCustomers = getAllCustomers;
exports.getCustomerById = getCustomerById;
exports.createCustomer = createCustomer;
exports.updateCustomer = updateCustomer;
exports.deleteCustomer = deleteCustomer;
const customerService_1 = require("../services/customerService");
const response_1 = require("../utils/response");
const zod_1 = require("zod");
const auditLogger_1 = require("../utils/auditLogger");
const addressSchema = zod_1.z.object({
    type: zod_1.z.enum(['billing', 'shipping']),
    street: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    state: zod_1.z.string().min(1),
    country: zod_1.z.string().min(1),
    pincode: zod_1.z.string().min(1),
    isDefault: zod_1.z.boolean().optional(),
});
const customerSchema = zod_1.z.object({
    businessProfileId: zod_1.z.string(),
    name: zod_1.z.string().min(1),
    companyName: zod_1.z.string().optional(),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional(),
    taxId: zod_1.z.string().optional(),
    creditLimit: zod_1.z.number().optional(),
    paymentTerms: zod_1.z.string().optional(),
    currency: zod_1.z.string(),
    notes: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isActive: zod_1.z.boolean().optional(),
    addresses: zod_1.z.array(addressSchema).optional(),
});
async function getAllCustomers(req, res, next) {
    try {
        const userId = req.user?.id;
        const { businessProfileId } = req.query;
        if (!businessProfileId)
            return (0, response_1.fail)(res, 400, 'MISSING_PARAM', 'businessProfileId is required');
        const customers = await customerService_1.customerService.getAll(userId, businessProfileId);
        return (0, response_1.success)(res, customers, 'Customers retrieved successfully');
    }
    catch (error) {
        next(error);
    }
}
async function getCustomerById(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const customer = await customerService_1.customerService.getById(id, userId);
        if (!customer)
            return (0, response_1.fail)(res, 404, 'NOT_FOUND', 'Customer not found or access denied');
        return (0, response_1.success)(res, customer, 'Customer retrieved successfully');
    }
    catch (error) {
        next(error);
    }
}
async function createCustomer(req, res, next) {
    try {
        const userId = req.user?.id;
        const parsed = customerSchema.parse(req.body);
        const customer = await customerService_1.customerService.create({ ...parsed, userId });
        // SOC 2: Audit log for customer creation
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'CREATE',
            entity: 'CUSTOMER',
            entityId: customer.id,
            newData: customer,
            metadata: { customerName: customer.name }
        });
        return (0, response_1.success)(res, customer, 'Customer created successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
async function updateCustomer(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const parsed = customerSchema.partial().parse(req.body);
        const customer = await customerService_1.customerService.update(id, userId, parsed);
        if (!customer)
            return (0, response_1.fail)(res, 404, 'NOT_FOUND', 'Customer not found or access denied');
        // SOC 2: Audit log for customer update
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'UPDATE',
            entity: 'CUSTOMER',
            entityId: id,
            newData: parsed,
            metadata: { customerName: customer.name }
        });
        return (0, response_1.success)(res, customer, 'Customer updated successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
async function deleteCustomer(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const result = await customerService_1.customerService.delete(id, userId);
        if (!result)
            return (0, response_1.fail)(res, 404, 'NOT_FOUND', 'Customer not found or access denied');
        // SOC 2: Audit log for customer deletion
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'DELETE',
            entity: 'CUSTOMER',
            entityId: id,
        });
        return (0, response_1.success)(res, null, 'Customer deleted successfully');
    }
    catch (error) {
        next(error);
    }
}
