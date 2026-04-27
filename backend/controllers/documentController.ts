import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/documentService';
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
  unitPrice: z.number(),
  discountPercent: z.number().default(0),
  discountAmount: z.number().default(0),
  taxType: z.string().default('NONE'),
  taxRate: z.number().default(0),
  taxAmount: z.number().default(0),
  totalBeforeTax: z.number(),
  totalAfterTax: z.number(),
});

const taxBreakdownSchema = z.object({
  taxType: z.string(),
  taxRate: z.number(),
  taxableAmount: z.number(),
  taxAmount: z.number(),
});

const documentSchema = z.object({
  businessProfileId: z.string(),
  customerId: z.string(),
  type: z.string().default('invoice'),
  documentNumber: z.string(),
  issueDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  currency: z.string(),
  exchangeRate: z.number().default(1),
  subtotal: z.number(),
  discountTotal: z.number().default(0),
  taxTotal: z.number().default(0),
  grandTotal: z.number(),
  amountPaid: z.number().default(0),
  amountDue: z.number(),
  status: z.string().default('draft'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  referenceNumber: z.string().optional(),
  placeOfSupply: z.string().optional(),
  validityPeriod: z.number().optional(),
  incoterms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  reason: z.string().optional(),
  reasonCode: z.string().optional(),
  items: z.array(itemSchema),
  taxBreakdowns: z.array(taxBreakdownSchema).optional(),
});

export async function getAllDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const { businessProfileId, type } = req.query;
    if (!businessProfileId) return fail(res, 400, 'MISSING_PARAM', 'businessProfileId is required');
    
    const documents = await documentService.getAll(userId, businessProfileId as string, type as string);
    return success(res, documents, 'Documents retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getDocumentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const document = await documentService.getById(id, userId);
    if (!document) return fail(res, 404, 'NOT_FOUND', 'Document not found or access denied');
    return success(res, document, 'Document retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function createDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const parsed = documentSchema.parse(req.body);
    
    // Ensure dates are actual Date objects
    const data = {
      ...parsed,
      userId,
      issueDate: new Date(parsed.issueDate),
      dueDate: new Date(parsed.dueDate),
    };
    
    const document = await documentService.create(data);

    // SOC 2: Audit log for document creation
    await logAudit({
      userId,
      action: 'CREATE',
      entity: 'INVOICE',
      entityId: document.id,
      newData: document,
      metadata: { documentNumber: document.documentNumber }
    });

    return success(res, document, 'Document created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}

export async function updateDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const parsed = documentSchema.partial().parse(req.body);
    
    const data = {
      ...parsed,
      issueDate: parsed.issueDate ? new Date(parsed.issueDate) : undefined,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
    };
    
    const document = await documentService.update(id, userId, data);
    if (!document) return fail(res, 404, 'NOT_FOUND', 'Document not found or access denied');

    // SOC 2: Audit log for document update
    await logAudit({
      userId,
      action: 'UPDATE',
      entity: 'INVOICE',
      entityId: id,
      newData: data,
      metadata: { documentNumber: document.documentNumber }
    });

    return success(res, document, 'Document updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const result = await documentService.delete(id, userId);
    if (!result) return fail(res, 404, 'NOT_FOUND', 'Document not found or access denied');

    // SOC 2: Audit log for document deletion
    await logAudit({
      userId,
      action: 'DELETE',
      entity: 'INVOICE',
      entityId: id,
    });

    return success(res, null, 'Document deleted successfully');
  } catch (error) {
    next(error);
  }
}
