import { prisma } from '../config/db';
import { ProductCandidate, SupportedUnit } from '@openron/shared';

export class ProductService {
  static async findCandidates(storeId: string, query?: string): Promise<ProductCandidate[]> {
    const whereClause: any = { storeId };
    if (query && query.trim()) {
      whereClause.name = {
        contains: query.trim(),
      };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      unit: p.unit as SupportedUnit,
      currentStock: p.currentStock,
      price: p.salePrice,
    }));
  }

  static async findByName(storeId: string, name: string) {
    const trimmed = name.trim();
    const exact = await prisma.product.findFirst({
      where: {
        storeId,
        name: trimmed,
      },
    });

    if (exact) return exact;

    const matches = await prisma.product.findMany({
      where: {
        storeId,
        name: {
          contains: trimmed,
        },
      },
    });

    if (matches.length === 1) {
      return matches[0];
    }

    return null;
  }

  static async addStock(
    storeId: string,
    productName: string,
    quantity: number,
    unit: string,
    costPrice?: number
  ) {
    if (quantity <= 0) {
      throw new Error('Stock quantity to add must be positive');
    }

    let product = await this.findByName(storeId, productName);

    if (!product) {
      product = await prisma.product.create({
        data: {
          storeId,
          name: productName.trim(),
          unit,
          currentStock: quantity,
          costPrice: costPrice ?? 0,
        },
      });
    } else {
      product = await prisma.product.update({
        where: { id: product.id },
        data: {
          currentStock: product.currentStock + quantity,
          costPrice: costPrice !== undefined ? costPrice : product.costPrice,
        },
      });
    }

    const adjustment = await prisma.stockAdjustment.create({
      data: {
        storeId,
        productId: product.id,
        type: 'ADD',
        quantity,
        unit,
        notes: costPrice ? `Cost price: ₹${costPrice}` : undefined,
      },
    });

    return { product, adjustment };
  }

  static async removeStock(
    storeId: string,
    productName: string,
    quantity: number,
    unit: string,
    reason = 'sale'
  ) {
    if (quantity <= 0) {
      throw new Error('Stock quantity to remove must be positive');
    }

    const product = await this.findByName(storeId, productName);
    if (!product) {
      throw new Error(`Product "${productName}" nahi mila. Pehle ise stock mein add karein.`);
    }

    const newStock = Math.max(0, product.currentStock - quantity);
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        currentStock: newStock,
      },
    });

    const adjustment = await prisma.stockAdjustment.create({
      data: {
        storeId,
        productId: product.id,
        type: 'REMOVE',
        quantity,
        unit,
        reason,
      },
    });

    return { product: updated, adjustment };
  }

  static async getStock(storeId: string, productName: string) {
    const product = await this.findByName(storeId, productName);
    if (!product) return null;
    return {
      name: product.name,
      currentStock: product.currentStock,
      unit: product.unit,
    };
  }
}
