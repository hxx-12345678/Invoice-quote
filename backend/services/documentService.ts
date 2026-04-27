import { documentRepository } from '../repositories/documentRepository';

export class DocumentService {
  async getAll(userId: string, businessProfileId: string, type?: string) {
    return documentRepository.findAll(userId, businessProfileId, type);
  }

  async getById(id: string, userId: string) {
    return documentRepository.findById(id, userId);
  }

  async create(data: any) {
    return documentRepository.create(data);
  }

  async update(id: string, userId: string, data: any) {
    return documentRepository.update(id, userId, data);
  }

  async delete(id: string, userId: string) {
    return documentRepository.delete(id, userId);
  }
}

export const documentService = new DocumentService();
