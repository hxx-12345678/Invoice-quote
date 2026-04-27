import { customerRepository } from '../repositories/customerRepository';

export class CustomerService {
  async getAll(userId: string, businessProfileId: string) {
    return customerRepository.findAll(userId, businessProfileId);
  }

  async getById(id: string, userId: string) {
    return customerRepository.findById(id, userId);
  }

  async create(data: any) {
    return customerRepository.create(data);
  }

  async update(id: string, userId: string, data: any) {
    return customerRepository.update(id, userId, data);
  }

  async delete(id: string, userId: string) {
    return customerRepository.delete(id, userId);
  }
}

export const customerService = new CustomerService();
