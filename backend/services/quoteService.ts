import { quoteRepository } from '../repositories/quoteRepository';

export class QuoteService {
  async getAll(userId: string, businessProfileId: string) {
    return quoteRepository.findAll(userId, businessProfileId);
  }

  async getById(id: string, userId: string) {
    return quoteRepository.findById(id, userId);
  }

  async create(data: any) {
    return quoteRepository.create(data);
  }

  async update(id: string, userId: string, data: any) {
    return quoteRepository.update(id, userId, data);
  }

  async delete(id: string, userId: string) {
    return quoteRepository.delete(id, userId);
  }
}

export const quoteService = new QuoteService();
