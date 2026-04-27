import { businessRepository } from '../repositories/businessRepository';

export class BusinessService {
  async getByUserId(userId: string) {
    return businessRepository.findByUserId(userId);
  }

  async create(userId: string, data: any) {
    return businessRepository.create({
      userId,
      ...data,
    });
  }

  async update(userId: string, data: any) {
    return businessRepository.update(userId, data);
  }

  async createOrUpdate(userId: string, data: any) {
    const existing = await this.getByUserId(userId);
    if (existing) {
      return this.update(userId, data);
    }
    return this.create(userId, data);
  }
}

export const businessService = new BusinessService();
