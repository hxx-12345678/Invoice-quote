"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProducts = getAllProducts;
exports.getProductById = getProductById;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
const productService_1 = require("../services/productService");
const response_1 = require("../utils/response");
const zod_1 = require("zod");
const auditLogger_1 = require("../utils/auditLogger");
const productSchema = zod_1.z.object({
    businessProfileId: zod_1.z.string(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    sku: zod_1.z.string().optional(),
    hsnCode: zod_1.z.string().optional(),
    sacCode: zod_1.z.string().optional(),
    barcode: zod_1.z.string().optional(),
    unitPrice: zod_1.z.number().min(0),
    unit: zod_1.z.string(),
    taxRate: zod_1.z.number().min(0).default(0),
    taxType: zod_1.z.string().default('NONE'),
    category: zod_1.z.string().optional(),
    isService: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
    stockQuantity: zod_1.z.number().optional(),
    lowStockThreshold: zod_1.z.number().optional(),
});
async function getAllProducts(req, res, next) {
    try {
        const userId = req.user?.id;
        const { businessProfileId } = req.query;
        if (!businessProfileId)
            return (0, response_1.fail)(res, 400, 'MISSING_PARAM', 'businessProfileId is required');
        const products = await productService_1.productService.getAll(userId, businessProfileId);
        return (0, response_1.success)(res, products, 'Products retrieved successfully');
    }
    catch (error) {
        next(error);
    }
}
async function getProductById(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const product = await productService_1.productService.getById(id, userId);
        if (!product)
            return (0, response_1.fail)(res, 404, 'NOT_FOUND', 'Product not found or access denied');
        return (0, response_1.success)(res, product, 'Product retrieved successfully');
    }
    catch (error) {
        next(error);
    }
}
async function createProduct(req, res, next) {
    try {
        const userId = req.user?.id;
        const parsed = productSchema.parse(req.body);
        const product = await productService_1.productService.create({ ...parsed, userId });
        // SOC 2: Audit log for product creation
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'CREATE',
            entity: 'PRODUCT',
            entityId: product.id,
            newData: product,
            metadata: { productName: product.name }
        });
        return (0, response_1.success)(res, product, 'Product created successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
async function updateProduct(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const parsed = productSchema.partial().parse(req.body);
        const product = await productService_1.productService.update(id, userId, parsed);
        if (!product)
            return (0, response_1.fail)(res, 404, 'NOT_FOUND', 'Product not found or access denied');
        // SOC 2: Audit log for product update
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'UPDATE',
            entity: 'PRODUCT',
            entityId: id,
            newData: parsed,
            metadata: { productName: product.name }
        });
        return (0, response_1.success)(res, product, 'Product updated successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
async function deleteProduct(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const result = await productService_1.productService.delete(id, userId);
        if (!result)
            return (0, response_1.fail)(res, 404, 'NOT_FOUND', 'Product not found or access denied');
        // SOC 2: Audit log for product deletion
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'DELETE',
            entity: 'PRODUCT',
            entityId: id,
        });
        return (0, response_1.success)(res, null, 'Product deleted successfully');
    }
    catch (error) {
        next(error);
    }
}
