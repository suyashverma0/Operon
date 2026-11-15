import { prisma } from '../config/db';
import { CustomerCandidate } from '@openron/shared';

export class CustomerService {
  static async findCandidates(storeId: string, query?: string): Promise<CustomerCandidate[]> {
    const whereClause: any = { storeId };
    if (query && query.trim()) {
      whereClause.name = {
        contains: query.trim(),
      };
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      currentBalance: c.currentBalance,
    }));
  }

  static async findByName(storeId: string, name: string) {
    const trimmed = name.trim();
    // Try exact match first
    const exact = await prisma.customer.findFirst({
      where: {
        storeId,
        name: trimmed,
      },
    });

    if (exact) return exact;

    // Search case-insensitive or partial
    const matches = await prisma.customer.findMany({
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

  static async findOrCreate(storeId: string, name: string, phone?: string) {
    const existing = await this.findByName(storeId, name);
    if (existing) {
      return existing;
    }

    return await prisma.customer.create({
      data: {
        storeId,
        name: name.trim(),
        phone: phone?.trim(),
        currentBalance: 0.0,
      },
    });
  }

  static async getBalance(storeId: string, name: string) {
    const customer = await this.findByName(storeId, name);
    if (!customer) return null;
    return customer.currentBalance;
  }
}
