"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
// backend/utils/auditLogger.ts
const database_1 = require("../config/database");
async function logAudit({ userId, action, entity, entityId, oldData, newData, metadata }) {
    try {
        await database_1.prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : undefined,
                newData: newData ? JSON.parse(JSON.stringify(newData)) : undefined,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
            },
        });
    }
    catch (error) {
        console.error('Failed to create audit log:', error);
        // We don't throw here to prevent breaking the main flow if logging fails
    }
}
