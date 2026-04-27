import { productRepository } from '../repositories/productRepository';

export class ProductService {
  async getAll(userId: string, businessProfileId: string) {
    return productRepository.findAll(userId, businessProfileId);
  }

  async getById(id: string, userId: string) {
    return productRepository.findById(id, userId);
  }

  async create(data: any) {
    return productRepository.create(data);
  }

  async update(id: string, userId: string, data: any) {
    return productRepository.update(id, userId, data);
  }

  async delete(id: string, userId: string) {
    return productRepository.delete(id, userId);
  }
}

export const productService = new ProductService();
