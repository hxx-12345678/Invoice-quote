"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const settingsService_1 = require("../services/settingsService");
const response_1 = require("../utils/response");
const zod_1 = require("zod");
const settingsSchema = zod_1.z.object({
    currency: zod_1.z.string().optional(),
    taxSystem: zod_1.z.string().optional(),
    taxInclusive: zod_1.z.boolean().optional(),
    defaultTaxRate: zod_1.z.number().optional(),
    invoicePrefix: zod_1.z.string().optional(),
    invoiceStartNumber: zod_1.z.number().optional(),
    quotePrefix: zod_1.z.string().optional(),
    quoteStartNumber: zod_1.z.number().optional(),
    timezone: zod_1.z.string().optional(),
    dateFormat: zod_1.z.string().optional(),
    numberFormat: zod_1.z.string().optional(),
    defaultPaymentTerms: zod_1.z.string().optional(),
    defaultNotes: zod_1.z.string().optional(),
    defaultTerms: zod_1.z.string().optional(),
    emailNotifications: zod_1.z.boolean().optional(),
    reminderDays: zod_1.z.array(zod_1.z.number()).optional(),
});
async function getSettings(req, res, next) {
    try {
        const userId = req.user?.id;
        const settings = await settingsService_1.settingsService.getByUserId(userId);
        if (!settings) {
            return (0, response_1.success)(res, {}, 'No settings found');
        }
        return (0, response_1.success)(res, settings, 'Settings retrieved successfully');
    }
    catch (error) {
        next(error);
    }
}
async function updateSettings(req, res, next) {
    try {
        const userId = req.user?.id;
        const parsed = settingsSchema.parse(req.body);
        const settings = await settingsService_1.settingsService.update(userId, parsed);
        return (0, response_1.success)(res, settings, 'Settings updated successfully');
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_1.fail)(res, 400, 'VALIDATION_ERROR', error.errors.map((e) => e.message).join(', '));
        }
        next(error);
    }
}
