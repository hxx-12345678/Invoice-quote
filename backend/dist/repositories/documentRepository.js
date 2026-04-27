"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentRepository = exports.DocumentRepository = void 0;
const database_1 = require("../config/database");
class DocumentRepository {
    async findAll(userId, businessProfileId, type) {
        return database_1.prisma.document.findMany({
            where: { userId, businessProfileId, type },
            include: {
                customer: true,
                items: true,
                taxBreakdowns: true,
                payments: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id, userId) {
        return database_1.prisma.document.findFirst({
            where: { id, userId },
            include: {
                customer: true,
                items: true,
                taxBreakdowns: true,
                payments: true,
            },
        });
    }
    async create(data) {
        const { items, taxBreakdowns, ...docData } = data;
        return database_1.prisma.document.create({
            data: {
                ...docData,
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
        const { items, taxBreakdowns, ...docData } = data;
        const document = await this.findById(id, userId);
        if (!document)
            return null;
        return database_1.prisma.document.update({
            where: { id },
            data: {
                ...docData,
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
        const document = await this.findById(id, userId);
        if (!document)
            return null;
        return database_1.prisma.document.delete({
            where: { id },
        });
    }
    async getNextNumber(businessProfileId, type, prefix, startNumber) {
        const lastDoc = await database_1.prisma.document.findFirst({
            where: { businessProfileId, type },
            orderBy: { createdAt: 'desc' },
        });
        if (!lastDoc)
            return `${prefix}${startNumber}`;
        const match = lastDoc.documentNumber.match(/\d+$/);
        const nextNum = match ? parseInt(match[0]) + 1 : startNumber;
        return `${prefix}${nextNum}`;
    }
}
exports.DocumentRepository = DocumentRepository;
exports.documentRepository = new DocumentRepository();
