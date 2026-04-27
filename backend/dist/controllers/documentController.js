"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDocuments = getAllDocuments;
exports.getDocumentById = getDocumentById;
exports.createDocument = createDocument;
exports.updateDocument = updateDocument;
exports.deleteDocument = deleteDocument;
const documentService_1 = require("../services/documentService");
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
});
const taxBreakdownSchema = zod_1.z.object({
    taxType: zod_1.z.string(),
    taxRate: zod_1.z.number(),
    taxableAmount: zod_1.z.number(),
    taxAmount: zod_1.z.number(),
});
const documentSchema = zod_1.z.object({
    businessProfileId: zod_1.z.string(),
    customerId: zod_1.z.string(),
    type: zod_1.z.string().default('invoice'),
    documentNumber: zod_1.z.string(),
    issueDate: zod_1.z.string().or(zod_1.z.date()),
    dueDate: zod_1.z.string().or(zod_1.z.date()),
    currency: zod_1.z.string(),
    exchangeRate: zod_1.z.number().default(1),
    subtotal: zod_1.z.number(),
    discountTotal: zod_1.z.number().default(0),
    taxTotal: zod_1.z.number().default(0),
    grandTotal: zod_1.z.number(),
    amountPaid: zod_1.z.number().default(0),
    amountDue: zod_1.z.number(),
    status: zod_1.z.string().default('draft'),
    notes: zod_1.z.string().optional(),
    terms: zod_1.z.string().optional(),
    referenceNumber: zod_1.z.string().optional(),
    placeOfSupply: zod_1.z.string().optional(),
    items: zod_1.z.array(itemSchema),
    taxBreakdowns: zod_1.z.array(taxBreakdownSchema).optional(),
});
async function getAllDocuments(req, res, next) {
    try {
        const userId = req.user?.id;
        const { businessProfileId, type } = req.query;
        if (!businessProfileId)
            return (0, response_1.fail)(res, 400, 'MISSING_PARAM', 'businessProfileId is required');
        const documents = await documentService_1.documentService.getAll(userId, businessProfileId, type);
        return (0, response_1.success)(res, documents, 'Documents retrieved successfully');
    }
    catch (error) {
        next(error);
    }
}
async function getDocumentById(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const document = await documentService_1.documentService.getById(id, userId);
        if (!document)
            return (0, response_1.fail)(res, 404, 'NOT_FOUND', 'Document not found or access denied');
        return (0, response_1.success)(res, document, 'Document retrieved successfully');
    }
    catch (error) {
        next(error);
    }
}
async function createDocument(req, res, next) {
    try {
        const userId = req.user?.id;
        const parsed = documentSchema.parse(req.body);
        // Ensure dates are actual Date objects
        const data = {
            ...parsed,
            userId,
            issueDate: new Date(parsed.issueDate),
            dueDate: new Date(parsed.dueDate),
        };
        const document = await documentService_1.documentService.create(data);
        // SOC 2: Audit log for document creation
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'CREATE',
            entity: 'INVOICE',
            entityId: document.id,
            newData: document,
            metadata: { documentNumber: document.documentNumber }
        });
        return (0, response_1.success)(res, document, 'Document created successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
async function updateDocument(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const parsed = documentSchema.partial().parse(req.body);
        const data = {
            ...parsed,
            issueDate: parsed.issueDate ? new Date(parsed.issueDate) : undefined,
            dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
        };
        const document = await documentService_1.documentService.update(id, userId, data);
        if (!document)
            return (0, response_1.fail)(res, 404, 'NOT_FOUND', 'Document not found or access denied');
        // SOC 2: Audit log for document update
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'UPDATE',
            entity: 'INVOICE',
            entityId: id,
            newData: data,
            metadata: { documentNumber: document.documentNumber }
        });
        return (0, response_1.success)(res, document, 'Document updated successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
async function deleteDocument(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const result = await documentService_1.documentService.delete(id, userId);
        if (!result)
            return (0, response_1.fail)(res, 404, 'NOT_FOUND', 'Document not found or access denied');
        // SOC 2: Audit log for document deletion
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'DELETE',
            entity: 'INVOICE',
            entityId: id,
        });
        return (0, response_1.success)(res, null, 'Document deleted successfully');
    }
    catch (error) {
        next(error);
    }
}
