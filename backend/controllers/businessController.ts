import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { businessService } from '../services/businessService';
import { success, fail } from '../utils/response';

// Helper to validate URLs or data URLs
const urlOrDataUrl = z.string().refine(
  (val) => {
    if (!val) return true; // Empty is handled by optional()
    // Allow data URLs (from file uploads)
    if (val.startsWith('data:')) return true;
    // Allow regular URLs
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Must be a valid URL or data URL' }
);

// Helper to validate website URLs (more lenient)
const websiteUrl = z.string().refine(
  (val) => {
    if (!val) return true; // Empty is handled by optional()
    // Accept with or without protocol
    const urlStr = val.startsWith('http') ? val : `https://${val}`;
    try {
      new URL(urlStr);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Must be a valid website URL' }
);

const businessSchema = z.object({
  businessType: z.string().min(1, 'Business type is required'),
  businessName: z.string().min(1, 'Business name is required'),
  legalName: z.string().min(1, 'Legal name is required'),
  registrationNumber: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(1, 'Address is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  email: z.string().email('Must be a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  website: websiteUrl.optional().nullable(),
  logoUrl: urlOrDataUrl.optional().nullable(),
  bankDetails: z
    .object({
      bankName: z.string().min(1, 'Bank name is required'),
      accountNumber: z.string().min(1, 'Account number is required'),
      ifscCode: z.string().optional().nullable(),
      swiftCode: z.string().optional().nullable(),
      routingNumber: z.string().optional().nullable(),
      iban: z.string().optional().nullable(),
      accountHolderName: z.string().min(1, 'Account holder name is required'),
      branch: z.string().optional().nullable(),
    })
    .strict()
    .optional()
    .nullable(),
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
    
    // Clean up data: convert empty strings to undefined for optional fields
    const cleanData = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => [
        key,
        value === '' ? undefined : value,
      ])
    );

    const parsed = businessSchema.parse(cleanData);
    const profile = await businessService.createOrUpdate(userId, parsed);
    return success(res, profile, 'Business profile saved successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format errors to show field and reason
      const errorMessages = error.errors.map((e) => {
        const field = e.path.join('.');
        return `${field}: ${e.message}`;
      });
      return fail(res, 400, 'VALIDATION_ERROR', errorMessages.join(' | '));
    }
    next(error);
  }
}

export async function updateBusinessProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    
    // Clean up data: convert empty strings to undefined for optional fields
    const cleanData = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => [
        key,
        value === '' ? undefined : value,
      ])
    );

    const parsed = businessSchema.partial().parse(cleanData);
    const profile = await businessService.update(userId, parsed);
    return success(res, profile, 'Business profile updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format errors to show field and reason
      const errorMessages = error.errors.map((e) => {
        const field = e.path.join('.');
        return `${field}: ${e.message}`;
      });
      return fail(res, 400, 'VALIDATION_ERROR', errorMessages.join(' | '));
    }
    next(error);
  }
}
