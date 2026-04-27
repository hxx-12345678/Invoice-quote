import { prisma } from '../config/database';

export class QuoteRepository {
  async findAll(userId: string, businessProfileId: string) {
    return prisma.quote.findMany({
      where: { userId, businessProfileId },
      include: {
        customer: true,
        items: true,
        taxBreakdowns: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.quote.findFirst({
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

  async create(data: any) {
    const { items, taxBreakdowns, ...quoteData } = data;
    return prisma.quote.create({
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

  async update(id: string, userId: string, data: any) {
    const { items, taxBreakdowns, ...quoteData } = data;
    const quote = await this.findById(id, userId);
    if (!quote) return null;

    return prisma.quote.update({
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

  async delete(id: string, userId: string) {
    const quote = await this.findById(id, userId);
    if (!quote) return null;

    return prisma.quote.delete({
      where: { id },
    });
  }
}

export const quoteRepository = new QuoteRepository();
