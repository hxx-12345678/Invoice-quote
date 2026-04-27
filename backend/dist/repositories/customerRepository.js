"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerRepository = exports.CustomerRepository = void 0;
const database_1 = require("../config/database");
class CustomerRepository {
    async findAll(userId, businessProfileId) {
        return database_1.prisma.customer.findMany({
            where: { userId, businessProfileId },
            include: { addresses: true },
        });
    }
    async findById(id, userId) {
        return database_1.prisma.customer.findFirst({
            where: { id, userId },
            include: { addresses: true },
        });
    }
    async create(data) {
        const { addresses, ...customerData } = data;
        return database_1.prisma.customer.create({
            data: {
                ...customerData,
                addresses: addresses
                    ? {
                        create: addresses,
                    }
                    : undefined,
            },
            include: { addresses: true },
        });
    }
    async update(id, userId, data) {
        const { addresses, ...customerData } = data;
        const customer = await this.findById(id, userId);
        if (!customer)
            return null;
        return database_1.prisma.customer.update({
            where: { id },
            data: {
                ...customerData,
                addresses: addresses
                    ? {
                        deleteMany: {},
                        create: addresses,
                    }
                    : undefined,
            },
            include: { addresses: true },
        });
    }
    async delete(id, userId) {
        const customer = await this.findById(id, userId);
        if (!customer)
            return null;
        return database_1.prisma.customer.delete({
            where: { id },
        });
    }
}
exports.CustomerRepository = CustomerRepository;
exports.customerRepository = new CustomerRepository();
