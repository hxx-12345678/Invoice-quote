"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRepository = exports.SettingsRepository = void 0;
const database_1 = require("../config/database");
class SettingsRepository {
    async findByUserId(userId) {
        return database_1.prisma.userSettings.findUnique({
            where: { userId },
        });
    }
    async create(data) {
        return database_1.prisma.userSettings.create({
            data,
        });
    }
    async update(userId, data) {
        return database_1.prisma.userSettings.update({
            where: { userId },
            data,
        });
    }
}
exports.SettingsRepository = SettingsRepository;
exports.settingsRepository = new SettingsRepository();
