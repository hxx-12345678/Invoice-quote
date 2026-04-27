"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quoteRepository = exports.QuoteRepository = void 0;
const database_1 = require("../config/database");
class QuoteRepository {
    async findAll(userId, businessProfileId) {
        return database_1.prisma.quote.findMany({
            where: { userId, businessProfileId },
            include: {
                customer: true,
                items: true,
                taxBreakdowns: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id, userId) {
        return database_1.prisma.quote.findFirst({
            where: { id, userId },
            include: {
                customer: true,
                items: true,
                taxBreakdowns: true,
                versions: true,
                activities: true,
            },
        });
    }
    async create(data) {
        const { items, taxBreakdowns, ...quoteData } = data;
        return database_1.prisma.quote.create({
            data: {
                ...quoteData,
                items: {
                    create: items,
                },
                taxBreakdowns: taxBreakdowns
                    ? {
                        create: taxBreakdowns,
                    }
                    : undefined,
            },
            include: {
                items: true,
                taxBreakdowns: true,
            },
        });
    }
    async update(id, userId, data) {
        const { items, taxBreakdowns, ...quoteData } = data;
        const quote = await this.findById(id, userId);
        if (!quote)
            return null;
        return database_1.prisma.quote.update({
            where: { id },
            data: {
                ...quoteData,
                items: items
                    ? {
                        deleteMany: {},
                        create: items,
                    }
                    : undefined,
                taxBreakdowns: taxBreakdowns
                    ? {
                        deleteMany: {},
                        create: taxBreakdowns,
                    }
                    : undefined,
            },
            include: {
                items: true,
                taxBreakdowns: true,
            },
        });
    }
    async delete(id, userId) {
        const quote = await this.findById(id, userId);
        if (!quote)
            return null;
        return database_1.prisma.quote.delete({
            where: { id },
        });
    }
}
exports.QuoteRepository = QuoteRepository;
exports.quoteRepository = new QuoteRepository();
