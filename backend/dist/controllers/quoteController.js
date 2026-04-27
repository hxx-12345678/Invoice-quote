"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllQuotes = getAllQuotes;
exports.getQuoteById = getQuoteById;
exports.createQuote = createQuote;
exports.updateQuote = updateQuote;
exports.deleteQuote = deleteQuote;
const quoteService_1 = require("../services/quoteService");
const response_1 = require("../utils/response");
const zod_1 = require("zod");
const auditLogger_1 = require("../utils/auditLogger");
const itemSchema = zod_1.z.object({
    productId: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    hsnCode: zod_1.z.string().optional(),
    sacCode: zod_1.z.string().optional(),
    quantity: zod_1.z.number().min(0.001),
    unit: zod_1.z.string(),
    unitPrice: zod_1.z.number().min(0),
    discountPercent: zod_1.z.number().default(0),
    discountAmount: zod_1.z.number().default(0),
    taxType: zod_1.z.string().default('NONE'),
    taxRate: zod_1.z.number().default(0),
    taxAmount: zod_1.z.number().default(0),
    totalBeforeTax: zod_1.z.number(),
    totalAfterTax: zod_1.z.number(),
    isOptional: zod_1.z.boolean().optional(),
});
const taxBreakdownSchema = zod_1.z.object({
    taxType: zod_1.z.string(),
    taxRate: zod_1.z.number(),
    taxableAmount: zod_1.z.number(),
    taxAmount: zod_1.z.number(),
});
const quoteSchema = zod_1.z.object({
    businessProfileId: zod_1.z.string(),
    customerId: zod_1.z.string(),
    quoteNumber: zod_1.z.string(),
    status: zod_1.z.string().default('draft'),
    issueDate: zod_1.z.string().or(zod_1.z.date()),
    expiryDate: zod_1.z.string().or(zod_1.z.date()),
    currency: zod_1.z.string(),
    exchangeRate: zod_1.z.number().default(1),
    subtotal: zod_1.z.number(),
    discountTotal: zod_1.z.number().default(0),
    taxTotal: zod_1.z.number().default(0),
    grandTotal: zod_1.z.number(),
    notes: zod_1.z.string().optional(),
    terms: zod_1.z.string().optional(),
    referenceNumber: zod_1.z.string().optional(),
    placeOfSupply: zod_1.z.string().optional(),
    shareToken: zod_1.z.string(),
    items: zod_1.z.array(itemSchema),
    taxBreakdowns: zod_1.z.array(taxBreakdownSchema).optional(),
});
async function getAllQuotes(req, res, next) {
    try {
        const userId = req.user?.id;
        const { businessProfileId } = req.query;
        if (!businessProfileId)
            return (0, response_1.fail)(res, 400, 'MISSING_PARAM', 'businessProfileId is required');
        const quotes = await quoteService_1.quoteService.getAll(userId, businessProfileId);
        return (0, response_1.success)(res, quotes, 'Quotes retrieved successfully');
    }
    catch (error) {
        next(error);
    }
}
async function getQuoteById(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const quote = await quoteService_1.quoteService.getById(id, userId);
        if (!quote)
            return (0, response_1.fail)(res, 404, 'NOT_FOUND', 'Quote not found or access denied');
        return (0, response_1.success)(res, quote, 'Quote retrieved successfully');
    }
    catch (error) {
        next(error);
    }
}
async function createQuote(req, res, next) {
    try {
        const userId = req.user?.id;
        const parsed = quoteSchema.parse(req.body);
        const data = {
            ...parsed,
            userId,
            issueDate: new Date(parsed.issueDate),
            expiryDate: new Date(parsed.expiryDate),
        };
        const quote = await quoteService_1.quoteService.create(data);
        // SOC 2: Audit log for quote creation
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'CREATE',
            entity: 'QUOTE',
            entityId: quote.id,
            newData: quote,
            metadata: { quoteNumber: quote.quoteNumber }
        });
        return (0, response_1.success)(res, quote, 'Quote created successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
async function updateQuote(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const parsed = quoteSchema.partial().parse(req.body);
        const data = { ...parsed };
        if (parsed.issueDate)
            data.issueDate = new Date(parsed.issueDate);
        if (parsed.expiryDate)
            data.expiryDate = new Date(parsed.expiryDate);
        const quote = await quoteService_1.quoteService.update(id, userId, data);
        if (!quote)
            return (0, response_1.fail)(res, 404, 'NOT_FOUND', 'Quote not found or access denied');
        // SOC 2: Audit log for quote update
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'UPDATE',
            entity: 'QUOTE',
            entityId: id,
            newData: data,
            metadata: { quoteNumber: quote.quoteNumber }
        });
        return (0, response_1.success)(res, quote, 'Quote updated successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
async function deleteQuote(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const result = await quoteService_1.quoteService.delete(id, userId);
        if (!result)
            return (0, response_1.fail)(res, 404, 'NOT_FOUND', 'Quote not found or access denied');
        // SOC 2: Audit log for quote deletion
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'DELETE',
            entity: 'QUOTE',
            entityId: id,
        });
        return (0, response_1.success)(res, null, 'Quote deleted successfully');
    }
    catch (error) {
        next(error);
    }
}
