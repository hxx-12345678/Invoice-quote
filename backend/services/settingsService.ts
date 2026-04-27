import { settingsRepository } from '../repositories/settingsRepository';

export class SettingsService {
  async getByUserId(userId: string) {
    return settingsRepository.findByUserId(userId);
  }

  async create(userId: string, data: any) {
    return settingsRepository.create({
      userId,
      ...data,
    });
  }

  async update(userId: string, data: any) {
    const existing = await settingsRepository.findByUserId(userId);
    if (!existing) {
      return this.create(userId, data);
    }
    return settingsRepository.update(userId, data);
  }
}

export const settingsService = new SettingsService();
