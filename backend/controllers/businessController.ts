import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { businessService } from '../services/businessService';
import { success, fail } from '../utils/response';
import { logAudit } from '../utils/auditLogger';

const businessSchema = z.object({
  businessType: z.string().min(1),
  businessName: z.string().min(1),
  legalName: z.string().min(1),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  panNumber: z.string().optional(),
  country: z.string().min(1),
  state: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  pincode: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  bankDetails: z
    .object({
      bankName: z.string().min(1),
      accountNumber: z.string().min(1),
      ifscCode: z.string().optional(),
      swiftCode: z.string().optional(),
      routingNumber: z.string().optional(),
      iban: z.string().optional(),
      accountHolderName: z.string().min(1),
      branch: z.string().optional(),
    })
    .optional(),
});

export async function getBusinessProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const profile = await businessService.getByUserId(userId);
    if (!profile) {
      return fail(res, 404, 'NOT_FOUND', 'Business profile not found');
    }
    return success(res, profile, 'Business profile retrieved');
  } catch (error) {
    next(error);
  }
}

export async function createBusinessProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const parsed = businessSchema.parse(req.body);
    const profile = await businessService.createOrUpdate(userId, parsed);

    // SOC 2: Audit log for business profile update/create
    await logAudit({
      userId,
      action: 'UPDATE',
      entity: 'BUSINESS_PROFILE',
      entityId: profile.id,
      newData: profile,
      metadata: { businessName: profile.businessName }
    });

    return success(res, profile, 'Business profile saved successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}

export async function updateBusinessProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const parsed = businessSchema.partial().parse(req.body);
    const profile = await businessService.update(userId, parsed);
    return success(res, profile, 'Business profile updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}
