import { prisma } from '../config/database';

export class DocumentRepository {
  async findAll(userId: string, businessProfileId: string, type?: string) {
    return prisma.document.findMany({
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

  async findById(id: string, userId: string) {
    return prisma.document.findFirst({
      where: { id, userId },
      include: {
        customer: true,
        items: true,
        taxBreakdowns: true,
        payments: true,
      },
    });
  }

  async create(data: any) {
    const { items, taxBreakdowns, ...docData } = data;
    return prisma.document.create({
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

  async update(id: string, userId: string, data: any) {
    const { items, taxBreakdowns, ...docData } = data;
    const document = await this.findById(id, userId);
    if (!document) return null;

    return prisma.document.update({
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

  async delete(id: string, userId: string) {
    const document = await this.findById(id, userId);
    if (!document) return null;

    return prisma.document.delete({
      where: { id },
    });
  }

  async getNextNumber(businessProfileId: string, type: string, prefix: string, startNumber: number) {
    const lastDoc = await prisma.document.findFirst({
      where: { businessProfileId, type },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastDoc) return `${prefix}${startNumber}`;
    
    const match = lastDoc.documentNumber.match(/\d+$/);
    const nextNum = match ? parseInt(match[0]) + 1 : startNumber;
    return `${prefix}${nextNum}`;
  }
}

export const documentRepository = new DocumentRepository();
