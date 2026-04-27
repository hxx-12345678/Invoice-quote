"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = exports.ProductService = void 0;
const productRepository_1 = require("../repositories/productRepository");
class ProductService {
    async getAll(userId, businessProfileId) {
        return productRepository_1.productRepository.findAll(userId, businessProfileId);
    }
    async getById(id, userId) {
        return productRepository_1.productRepository.findById(id, userId);
    }
    async create(data) {
        return productRepository_1.productRepository.create(data);
    }
    async update(id, userId, data) {
        return productRepository_1.productRepository.update(id, userId, data);
    }
    async delete(id, userId) {
        return productRepository_1.productRepository.delete(id, userId);
    }
}
exports.ProductService = ProductService;
exports.productService = new ProductService();
