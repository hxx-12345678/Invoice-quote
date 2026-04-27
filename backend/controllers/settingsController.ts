import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settingsService';
import { success, fail } from '../utils/response';
import { z } from 'zod';

const settingsSchema = z.object({
  currency: z.string().optional(),
  taxSystem: z.string().optional(),
  taxInclusive: z.boolean().optional(),
  defaultTaxRate: z.number().optional(),
  invoicePrefix: z.string().optional(),
  invoiceStartNumber: z.number().optional(),
  quotePrefix: z.string().optional(),
  quoteStartNumber: z.number().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  numberFormat: z.string().optional(),
  defaultPaymentTerms: z.string().optional(),
  defaultNotes: z.string().optional(),
  defaultTerms: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  reminderDays: z.array(z.number()).optional(),
});

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const settings = await settingsService.getByUserId(userId);
    if (!settings) {
      return success(res, {}, 'No settings found');
    }
    return success(res, settings, 'Settings retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const parsed = settingsSchema.parse(req.body);
    const settings = await settingsService.update(userId, parsed);
    return success(res, settings, 'Settings updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}
