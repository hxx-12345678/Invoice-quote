"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepository = exports.ProductRepository = void 0;
const database_1 = require("../config/database");
class ProductRepository {
    async findAll(userId, businessProfileId) {
        return database_1.prisma.product.findMany({
            where: { userId, businessProfileId },
        });
    }
    async findById(id, userId) {
        return database_1.prisma.product.findFirst({
            where: { id, userId },
        });
    }
    async create(data) {
        return database_1.prisma.product.create({
            data,
        });
    }
    async update(id, userId, data) {
        const product = await this.findById(id, userId);
        if (!product)
            return null;
        return database_1.prisma.product.update({
            where: { id },
            data,
        });
    }
    async delete(id, userId) {
        const product = await this.findById(id, userId);
        if (!product)
            return null;
        return database_1.prisma.product.delete({
            where: { id },
        });
    }
}
exports.ProductRepository = ProductRepository;
exports.productRepository = new ProductRepository();
