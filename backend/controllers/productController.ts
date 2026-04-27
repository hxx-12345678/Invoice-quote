import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/productService';
import { success, fail } from '../utils/response';
import { z } from 'zod';
import { logAudit } from '../utils/auditLogger';

const productSchema = z.object({
  businessProfileId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  hsnCode: z.string().optional(),
  sacCode: z.string().optional(),
  barcode: z.string().optional(),
  unitPrice: z.number().min(0),
  unit: z.string(),
  taxRate: z.number().min(0).default(0),
  taxType: z.string().default('NONE'),
  category: z.string().optional(),
  isService: z.boolean().optional(),
  isActive: z.boolean().optional(),
  stockQuantity: z.number().optional(),
  lowStockThreshold: z.number().optional(),
});

export async function getAllProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const { businessProfileId } = req.query;
    if (!businessProfileId) return fail(res, 400, 'MISSING_PARAM', 'businessProfileId is required');
    
    const products = await productService.getAll(userId, businessProfileId as string);
    return success(res, products, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const product = await productService.getById(id, userId);
    if (!product) return fail(res, 404, 'NOT_FOUND', 'Product not found or access denied');
    return success(res, product, 'Product retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const parsed = productSchema.parse(req.body);
    const product = await productService.create({ ...parsed, userId });

    // SOC 2: Audit log for product creation
    await logAudit({
      userId,
      action: 'CREATE',
      entity: 'PRODUCT',
      entityId: product.id,
      newData: product,
      metadata: { productName: product.name }
    });

    return success(res, product, 'Product created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const parsed = productSchema.partial().parse(req.body);
    const product = await productService.update(id, userId, parsed);
    if (!product) return fail(res, 404, 'NOT_FOUND', 'Product not found or access denied');

    // SOC 2: Audit log for product update
    await logAudit({
      userId,
      action: 'UPDATE',
      entity: 'PRODUCT',
      entityId: id,
      newData: parsed,
      metadata: { productName: product.name }
    });

    return success(res, product, 'Product updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const result = await productService.delete(id, userId);
    if (!result) return fail(res, 404, 'NOT_FOUND', 'Product not found or access denied');

    // SOC 2: Audit log for product deletion
    await logAudit({
      userId,
      action: 'DELETE',
      entity: 'PRODUCT',
      entityId: id,
    });

    return success(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
}
