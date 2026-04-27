import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class SettingsRepository {
  async findByUserId(userId: string) {
    return prisma.userSettings.findUnique({
      where: { userId },
    });
  }

  async create(data: Prisma.UserSettingsCreateInput) {
    return prisma.userSettings.create({
      data,
    });
  }

  async update(userId: string, data: Prisma.UserSettingsUpdateInput) {
    return prisma.userSettings.update({
      where: { userId },
      data,
    });
  }
}

export const settingsRepository = new SettingsRepository();
