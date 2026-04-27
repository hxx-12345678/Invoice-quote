// backend/utils/auditLogger.ts
import { prisma } from '../config/database';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'ACCESS';
export type AuditEntity = 'USER' | 'BUSINESS_PROFILE' | 'CUSTOMER' | 'PRODUCT' | 'INVOICE' | 'QUOTE' | 'SETTINGS';

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  oldData,
  newData,
  metadata
}: {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  oldData?: any;
  newData?: any;
  metadata?: any;
}) {
  try {
    await prisma.auditLog.create({
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
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // We don't throw here to prevent breaking the main flow if logging fails
  }
}
