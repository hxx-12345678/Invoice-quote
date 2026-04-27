"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBusinessProfile = getBusinessProfile;
exports.createBusinessProfile = createBusinessProfile;
exports.updateBusinessProfile = updateBusinessProfile;
const zod_1 = require("zod");
const businessService_1 = require("../services/businessService");
const response_1 = require("../utils/response");
const auditLogger_1 = require("../utils/auditLogger");
const businessSchema = zod_1.z.object({
    businessType: zod_1.z.string().min(1),
    businessName: zod_1.z.string().min(1),
    legalName: zod_1.z.string().min(1),
    registrationNumber: zod_1.z.string().optional(),
    taxId: zod_1.z.string().optional(),
    panNumber: zod_1.z.string().optional(),
    country: zod_1.z.string().min(1),
    state: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    address: zod_1.z.string().min(1),
    pincode: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(1),
    website: zod_1.z.string().url().optional(),
    logoUrl: zod_1.z.string().url().optional(),
    bankDetails: zod_1.z
        .object({
        bankName: zod_1.z.string().min(1),
        accountNumber: zod_1.z.string().min(1),
        ifscCode: zod_1.z.string().optional(),
        swiftCode: zod_1.z.string().optional(),
        routingNumber: zod_1.z.string().optional(),
        iban: zod_1.z.string().optional(),
        accountHolderName: zod_1.z.string().min(1),
        branch: zod_1.z.string().optional(),
    })
        .optional(),
});
async function getBusinessProfile(req, res, next) {
    try {
        const userId = req.user?.id;
        const profile = await businessService_1.businessService.getByUserId(userId);
        if (!profile) {
            return (0, response_1.fail)(res, 404, 'NOT_FOUND', 'Business profile not found');
        }
        return (0, response_1.success)(res, profile, 'Business profile retrieved');
    }
    catch (error) {
        next(error);
    }
}
async function createBusinessProfile(req, res, next) {
    try {
        const userId = req.user?.id;
        const parsed = businessSchema.parse(req.body);
        const profile = await businessService_1.businessService.createOrUpdate(userId, parsed);
        // SOC 2: Audit log for business profile update/create
        await (0, auditLogger_1.logAudit)({
            userId,
            action: 'UPDATE',
            entity: 'BUSINESS_PROFILE',
            entityId: profile.id,
            newData: profile,
            metadata: { businessName: profile.businessName }
        });
        return (0, response_1.success)(res, profile, 'Business profile saved successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
async function updateBusinessProfile(req, res, next) {
    try {
        const userId = req.user?.id;
        const parsed = businessSchema.partial().parse(req.body);
        const profile = await businessService_1.businessService.update(userId, parsed);
        return (0, response_1.success)(res, profile, 'Business profile updated successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
