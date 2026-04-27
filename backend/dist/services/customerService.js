"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerService = exports.CustomerService = void 0;
const customerRepository_1 = require("../repositories/customerRepository");
class CustomerService {
    async getAll(userId, businessProfileId) {
        return customerRepository_1.customerRepository.findAll(userId, businessProfileId);
    }
    async getById(id, userId) {
        return customerRepository_1.customerRepository.findById(id, userId);
    }
    async create(data) {
        return customerRepository_1.customerRepository.create(data);
    }
    async update(id, userId, data) {
        return customerRepository_1.customerRepository.update(id, userId, data);
    }
    async delete(id, userId) {
        return customerRepository_1.customerRepository.delete(id, userId);
    }
}
exports.CustomerService = CustomerService;
exports.customerService = new CustomerService();
