"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessService = exports.BusinessService = void 0;
const businessRepository_1 = require("../repositories/businessRepository");
class BusinessService {
    async getByUserId(userId) {
        return businessRepository_1.businessRepository.findByUserId(userId);
    }
    async create(userId, data) {
        return businessRepository_1.businessRepository.create({
            userId,
            ...data,
        });
    }
    async update(userId, data) {
        return businessRepository_1.businessRepository.update(userId, data);
    }
    async createOrUpdate(userId, data) {
        const existing = await this.getByUserId(userId);
        if (existing) {
            return this.update(userId, data);
        }
        return this.create(userId, data);
    }
}
exports.BusinessService = BusinessService;
exports.businessService = new BusinessService();
