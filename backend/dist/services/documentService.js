"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentService = exports.DocumentService = void 0;
const documentRepository_1 = require("../repositories/documentRepository");
class DocumentService {
    async getAll(userId, businessProfileId, type) {
        return documentRepository_1.documentRepository.findAll(userId, businessProfileId, type);
    }
    async getById(id, userId) {
        return documentRepository_1.documentRepository.findById(id, userId);
    }
    async create(data) {
        return documentRepository_1.documentRepository.create(data);
    }
    async update(id, userId, data) {
        return documentRepository_1.documentRepository.update(id, userId, data);
    }
    async delete(id, userId) {
        return documentRepository_1.documentRepository.delete(id, userId);
    }
}
exports.DocumentService = DocumentService;
exports.documentService = new DocumentService();
