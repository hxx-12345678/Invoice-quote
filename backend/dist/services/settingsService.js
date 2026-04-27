"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = exports.SettingsService = void 0;
const settingsRepository_1 = require("../repositories/settingsRepository");
class SettingsService {
    async getByUserId(userId) {
        return settingsRepository_1.settingsRepository.findByUserId(userId);
    }
    async create(userId, data) {
        return settingsRepository_1.settingsRepository.create({
            userId,
            ...data,
        });
    }
    async update(userId, data) {
        const existing = await settingsRepository_1.settingsRepository.findByUserId(userId);
        if (!existing) {
            return this.create(userId, data);
        }
        return settingsRepository_1.settingsRepository.update(userId, data);
    }
}
exports.SettingsService = SettingsService;
exports.settingsService = new SettingsService();
