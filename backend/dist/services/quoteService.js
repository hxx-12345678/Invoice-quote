"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quoteService = exports.QuoteService = void 0;
const quoteRepository_1 = require("../repositories/quoteRepository");
class QuoteService {
    async getAll(userId, businessProfileId) {
        return quoteRepository_1.quoteRepository.findAll(userId, businessProfileId);
    }
    async getById(id, userId) {
        return quoteRepository_1.quoteRepository.findById(id, userId);
    }
    async create(data) {
        return quoteRepository_1.quoteRepository.create(data);
    }
    async update(id, userId, data) {
        return quoteRepository_1.quoteRepository.update(id, userId, data);
    }
    async delete(id, userId) {
        return quoteRepository_1.quoteRepository.delete(id, userId);
    }
}
exports.QuoteService = QuoteService;
exports.quoteService = new QuoteService();
