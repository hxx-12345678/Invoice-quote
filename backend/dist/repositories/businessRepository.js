"use strict";
// backend/repositories/businessRepository.ts
// Business Profile Repository - Database Operations
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessRepository = exports.BusinessRepository = void 0;
const database_1 = require("../config/database");
function normalizeBankDetails(bankDetails) {
    if (!bankDetails)
        return undefined;
    const detailsArray = Array.isArray(bankDetails) ? bankDetails : [bankDetails];
    return {
        create: detailsArray.map((detail) => ({
            bankName: detail.bankName,
            accountNumber: detail.accountNumber,
            accountHolderName: detail.accountHolderName,
            ifscCode: detail.ifscCode,
            swiftCode: detail.swiftCode,
            routingNumber: detail.routingNumber,
            iban: detail.iban,
            branch: detail.branch,
            isDefault: detail.isDefault ?? true,
        })),
    };
}
class BusinessRepository {
    async findByUserId(userId) {
        return database_1.prisma.businessProfile.findUnique({
            where: { userId },
        });
    }
    async create(data) {
        const { bankDetails, ...profileData } = data;
        return database_1.prisma.businessProfile.create({
            data: {
                ...profileData,
                bankDetails: normalizeBankDetails(bankDetails),
            },
        });
    }
    async update(userId, data) {
        const { bankDetails, ...profileData } = data;
        return database_1.prisma.businessProfile.update({
            where: { userId },
            data: {
                ...profileData,
                bankDetails: bankDetails ? {
                    deleteMany: {},
                    ...normalizeBankDetails(bankDetails),
                } : undefined,
            },
        });
    }
    async delete(userId) {
        return database_1.prisma.businessProfile.delete({
            where: { userId },
        });
    }
}
exports.BusinessRepository = BusinessRepository;
exports.businessRepository = new BusinessRepository();
