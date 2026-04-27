"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.forgotPassword = forgotPassword;
exports.getMe = getMe;
exports.exportData = exportData;
exports.deleteAccount = deleteAccount;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const response_1 = require("../utils/response");
const zod_1 = require("zod");
const auditLogger_1 = require("../utils/auditLogger");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    name: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
async function register(req, res, next) {
    try {
        const { email, password, name } = registerSchema.parse(req.body);
        const existingUser = await database_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return (0, response_1.fail)(res, 400, 'USER_EXISTS', 'User already exists');
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await database_1.prisma.user.create({
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
        await (0, auditLogger_1.logAudit)({
            userId: user.id,
            action: 'CREATE',
            entity: 'USER',
            entityId: user.id,
            metadata: { email: user.email, ip: req.ip, userAgent: req.get('user-agent') }
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
            algorithm: 'HS256',
            expiresIn: (process.env.JWT_EXPIRES_IN || '1d'),
            audience: 'quotiq-client',
            issuer: 'quotiq-backend',
        });
        return (0, response_1.success)(res, { user: { id: user.id, email: user.email, name: user.name }, token }, 'Registration successful');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
async function login(req, res, next) {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return (0, response_1.fail)(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return (0, response_1.fail)(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }
        // SOC 2: Log successful login
        await (0, auditLogger_1.logAudit)({
            userId: user.id,
            action: 'LOGIN',
            entity: 'USER',
            entityId: user.id,
            metadata: { ip: req.ip, userAgent: req.get('user-agent') }
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
            algorithm: 'HS256',
            expiresIn: (process.env.JWT_EXPIRES_IN || '1d'),
            audience: 'quotiq-client',
            issuer: 'quotiq-backend',
        });
        return (0, response_1.success)(res, { user: { id: user.id, email: user.email, name: user.name }, token }, 'Login successful');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
async function forgotPassword(req, res, next) {
    try {
        const { email } = zod_1.z.object({ email: zod_1.z.string().email() }).parse(req.body);
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        // Always return success for security reasons (don't reveal if email exists)
        return (0, response_1.success)(res, null, 'If an account exists, a reset link has been sent');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
async function getMe(req, res, next) {
    try {
        const userId = req.user?.id;
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, phone: true, isActive: true },
        });
        return (0, response_1.success)(res, user, 'User profile retrieved');
    }
    catch (error) {
        next(error);
    }
}
/**
 * GDPR: Right to Data Portability
 * Exports all data associated with the user
 */
async function exportData(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId)
            return (0, response_1.fail)(res, 401, 'UNAUTHORIZED', 'User not authenticated');
        const userData = await database_1.prisma.user.findUnique({
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
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'EXPORT',
            entity: 'USER',
            entityId: userId,
            metadata: { ip: req.ip, userAgent: req.get('user-agent') }
        });
        return (0, response_1.success)(res, userData, 'Data exported successfully');
    }
    catch (error) {
        next(error);
    }
}
/**
 * GDPR: Right to Erasure
 * Deletes user account and all associated data
 */
async function deleteAccount(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId)
            return (0, response_1.fail)(res, 401, 'UNAUTHORIZED', 'User not authenticated');
        // Perform deletion (Prisma handles cascading deletes based on schema)
        await database_1.prisma.user.delete({
            where: { id: userId }
        });
        return (0, response_1.success)(res, null, 'Account and all associated data deleted successfully');
    }
    catch (error) {
        next(error);
    }
}
