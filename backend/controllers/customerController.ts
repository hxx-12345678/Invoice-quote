import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customerService';
import { success, fail } from '../utils/response';
import { z } from 'zod';
import { logAudit } from '../utils/auditLogger';

const addressSchema = z.object({
  type: z.enum(['billing', 'shipping']),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  pincode: z.string().min(1),
  isDefault: z.boolean().optional(),
});

const customerSchema = z.object({
  businessProfileId: z.string(),
  name: z.string().min(1),
  companyName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  creditLimit: z.number().optional(),
  paymentTerms: z.string().optional(),
  currency: z.string(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  addresses: z.array(addressSchema).optional(),
});

export async function getAllCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const { businessProfileId } = req.query;
    if (!businessProfileId) return fail(res, 400, 'MISSING_PARAM', 'businessProfileId is required');
    
    const customers = await customerService.getAll(userId, businessProfileId as string);
    return success(res, customers, 'Customers retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const customer = await customerService.getById(id, userId);
    if (!customer) return fail(res, 404, 'NOT_FOUND', 'Customer not found or access denied');
    return success(res, customer, 'Customer retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string;
    const parsed = customerSchema.parse(req.body);
    const customer = await customerService.create({ ...parsed, userId });

    // SOC 2: Audit log for customer creation
    await logAudit({
      userId,
      action: 'CREATE',
      entity: 'CUSTOMER',
      entityId: customer.id,
      newData: customer,
      metadata: { customerName: customer.name }
    });

    return success(res, customer, 'Customer created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const parsed = customerSchema.partial().parse(req.body);
    const customer = await customerService.update(id, userId, parsed);
    if (!customer) return fail(res, 404, 'NOT_FOUND', 'Customer not found or access denied');

    // SOC 2: Audit log for customer update
    await logAudit({
      userId,
      action: 'UPDATE',
      entity: 'CUSTOMER',
      entityId: id,
      newData: parsed,
      metadata: { customerName: customer.name }
    });

    return success(res, customer, 'Customer updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const result = await customerService.delete(id, userId);
    if (!result) return fail(res, 404, 'NOT_FOUND', 'Customer not found or access denied');

    // SOC 2: Audit log for customer deletion
    await logAudit({
      userId,
      action: 'DELETE',
      entity: 'CUSTOMER',
      entityId: id,
    });

    return success(res, null, 'Customer deleted successfully');
  } catch (error) {
    next(error);
  }
}
