import { Request, Response, NextFunction } from 'express';
import { quoteService } from '../services/quoteService';
import { success, fail } from '../utils/response';
import { z } from 'zod';
import { logAudit } from '../utils/auditLogger';

const itemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  hsnCode: z.string().optional(),
  sacCode: z.string().optional(),
  quantity: z.number().min(0.001),
  unit: z.string(),
  unitPrice: z.number().min(0),
  discountPercent: z.number().default(0),
  discountAmount: z.number().default(0),
  taxType: z.string().default('NONE'),
  taxRate: z.number().default(0),
  taxAmount: z.number().default(0),
  totalBeforeTax: z.number(),
  totalAfterTax: z.number(),
  isOptional: z.boolean().optional(),
});

const taxBreakdownSchema = z.object({
  taxType: z.string(),
  taxRate: z.number(),
  taxableAmount: z.number(),
  taxAmount: z.number(),
});

const quoteSchema = z.object({
  businessProfileId: z.string(),
  customerId: z.string(),
  quoteNumber: z.string(),
  status: z.string().default('draft'),
  issueDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()),
  currency: z.string(),
  exchangeRate: z.number().default(1),
  subtotal: z.number(),
  discountTotal: z.number().default(0),
  taxTotal: z.number().default(0),
  grandTotal: z.number(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  referenceNumber: z.string().optional(),
  placeOfSupply: z.string().optional(),
  shareToken: z.string(),
  items: z.array(itemSchema),
  taxBreakdowns: z.array(taxBreakdownSchema).optional(),
});

export async function getAllQuotes(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const { businessProfileId } = req.query;
    if (!businessProfileId) return fail(res, 400, 'MISSING_PARAM', 'businessProfileId is required');
    
    const quotes = await quoteService.getAll(userId, businessProfileId as string);
    return success(res, quotes, 'Quotes retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getQuoteById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const quote = await quoteService.getById(id, userId);
    if (!quote) return fail(res, 404, 'NOT_FOUND', 'Quote not found or access denied');
    return success(res, quote, 'Quote retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function createQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const parsed = quoteSchema.parse(req.body);
    
    const data = {
      ...parsed,
      userId,
      issueDate: new Date(parsed.issueDate),
      expiryDate: new Date(parsed.expiryDate),
    };
    
    const quote = await quoteService.create(data);

    // SOC 2: Audit log for quote creation
    await logAudit({
      userId,
      action: 'CREATE',
      entity: 'QUOTE',
      entityId: quote.id,
      newData: quote,
      metadata: { quoteNumber: quote.quoteNumber }
    });

    return success(res, quote, 'Quote created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}

export async function updateQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const parsed = quoteSchema.partial().parse(req.body);
    
    const data = { ...parsed };
    if (parsed.issueDate) data.issueDate = new Date(parsed.issueDate);
    if (parsed.expiryDate) data.expiryDate = new Date(parsed.expiryDate);
    
    const quote = await quoteService.update(id, userId, data);
    if (!quote) return fail(res, 404, 'NOT_FOUND', 'Quote not found or access denied');

    // SOC 2: Audit log for quote update
    await logAudit({
      userId,
      action: 'UPDATE',
      entity: 'QUOTE',
      entityId: id,
      newData: data,
      metadata: { quoteNumber: quote.quoteNumber }
    });

    return success(res, quote, 'Quote updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}

export async function deleteQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const result = await quoteService.delete(id, userId);
    if (!result) return fail(res, 404, 'NOT_FOUND', 'Quote not found or access denied');

    // SOC 2: Audit log for quote deletion
    await logAudit({
      userId,
      action: 'DELETE',
      entity: 'QUOTE',
      entityId: id,
    });

    return success(res, null, 'Quote deleted successfully');
  } catch (error) {
    next(error);
  }
}
