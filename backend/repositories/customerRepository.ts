import { prisma } from '../config/database';

export class CustomerRepository {
  async findAll(userId: string, businessProfileId: string) {
    return prisma.customer.findMany({
      where: { userId, businessProfileId },
      include: { addresses: true },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.customer.findFirst({
      where: { id, userId },
      include: { addresses: true },
    });
  }

  async create(data: any) {
    const { addresses, ...customerData } = data;
    return prisma.customer.create({
      data: {
        ...customerData,
        addresses: addresses
          ? {
              create: addresses,
            }
          : undefined,
      },
      include: { addresses: true },
    });
  }

  async update(id: string, userId: string, data: any) {
    const { addresses, ...customerData } = data;
    const customer = await this.findById(id, userId);
    if (!customer) return null;

    return prisma.customer.update({
      where: { id },
      data: {
        ...customerData,
        addresses: addresses
          ? {
              deleteMany: {},
              create: addresses,
            }
          : undefined,
      },
      include: { addresses: true },
    });
  }

  async delete(id: string, userId: string) {
    const customer = await this.findById(id, userId);
    if (!customer) return null;

    return prisma.customer.delete({
      where: { id },
    });
  }
}

export const customerRepository = new CustomerRepository();
