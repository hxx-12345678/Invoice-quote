// backend/repositories/businessRepository.ts
// Business Profile Repository - Database Operations

import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

function normalizeBankDetails(bankDetails: any) {
  if (!bankDetails) return undefined;
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

export class BusinessRepository {
  async findByUserId(userId: string) {
    return prisma.businessProfile.findUnique({
      where: { userId },
    });
  }

  async create(data: Prisma.BusinessProfileCreateInput) {
    const { bankDetails, ...profileData } = data as any;
    return prisma.businessProfile.create({
      data: {
        ...profileData,
        bankDetails: normalizeBankDetails(bankDetails),
      },
    });
  }

  async update(userId: string, data: Prisma.BusinessProfileUpdateInput) {
    const { bankDetails, ...profileData } = data as any;
    return prisma.businessProfile.update({
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

  async delete(userId: string) {
    return prisma.businessProfile.delete({
      where: { userId },
    });
  }
}

export const businessRepository = new BusinessRepository();
