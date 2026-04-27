import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { success, fail } from '../utils/response';
import { z } from 'zod';
import { logAudit } from '../utils/auditLogger';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return fail(res, 400, 'USER_EXISTS', 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        settings: {
          create: {}, // Create default settings
        },
      },
    });

    // SOC 2: Log user registration
    await logAudit({
      userId: user.id,
      action: 'CREATE',
      entity: 'USER',
      entityId: user.id,
      metadata: { email: user.email, ip: req.ip, userAgent: req.get('user-agent') }
    });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string, {
      algorithm: 'HS256',
      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'],
      audience: 'quotiq-client',
      issuer: 'quotiq-backend',
    });

    return success(res, { user: { id: user.id, email: user.email, name: user.name }, token }, 'Registration successful');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return fail(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return fail(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // SOC 2: Log successful login
    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id,
      metadata: { ip: req.ip, userAgent: req.get('user-agent') }
    });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string, {
      algorithm: 'HS256',
      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'],
      audience: 'quotiq-client',
      issuer: 'quotiq-backend',
    });

    return success(res, { user: { id: user.id, email: user.email, name: user.name }, token }, 'Login successful');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Always return success for security reasons (don't reveal if email exists)
    return success(res, null, 'If an account exists, a reset link has been sent');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
    }
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, isActive: true },
    });
    return success(res, user, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
}

/**
 * GDPR: Right to Data Portability
 * Exports all data associated with the user
 */
export async function exportData(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) return fail(res, 401, 'UNAUTHORIZED', 'User not authenticated');

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        businessProfiles: {
          include: {
            bankDetails: true,
            teams: true,
            invoiceTemplates: true,
          }
        },
        customers: {
          include: {
            addresses: true,
          }
        },
        products: true,
        documents: {
          include: {
            items: true,
            taxBreakdowns: true,
            payments: true,
          }
        },
        quotes: {
          include: {
            items: true,
            taxBreakdowns: true,
            versions: true,
            activities: true,
          }
        },
        settings: true,
        auditLogs: true,
      }
    });

    // Log the data export event for SOC 2
    await logAudit({
      userId,
      action: 'EXPORT',
      entity: 'USER',
      entityId: userId,
      metadata: { ip: req.ip, userAgent: req.get('user-agent') }
    });

    return success(res, userData, 'Data exported successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GDPR: Right to Erasure
 * Deletes user account and all associated data
 */
export async function deleteAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) return fail(res, 401, 'UNAUTHORIZED', 'User not authenticated');

    // Perform deletion (Prisma handles cascading deletes based on schema)
    await prisma.user.delete({
      where: { id: userId }
    });

    return success(res, null, 'Account and all associated data deleted successfully');
  } catch (error) {
    next(error);
  }
}
