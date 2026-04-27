import { prisma } from '../config/database';

export class ProductRepository {
  async findAll(userId: string, businessProfileId: string) {
    return prisma.product.findMany({
      where: { userId, businessProfileId },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.product.findFirst({
      where: { id, userId },
    });
  }

  async create(data: any) {
    return prisma.product.create({
      data,
    });
  }

  async update(id: string, userId: string, data: any) {
    const product = await this.findById(id, userId);
    if (!product) return null;
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    const product = await this.findById(id, userId);
    if (!product) return null;
    return prisma.product.delete({
      where: { id },
    });
  }
}

export const productRepository = new ProductRepository();
