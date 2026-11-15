import { prisma } from '../config/db';
import { CustomerService } from './customerService';
import { parseRelativeDate } from '../utils/helpers';

export class TransactionService {
  static async addUdhaar(
    storeId: string,
    customerName: string,
    amount: number,
    relativeDate?: string,
    notes?: string
  ) {
    if (amount <= 0) {
      throw new Error('Udhaar amount must be greater than zero.');
    }

    const customer = await CustomerService.findOrCreate(storeId, customerName);
    const transactionDate = relativeDate ? parseRelativeDate(relativeDate) : new Date();

    return await prisma.$transaction(async (tx) => {
      const newBalance = customer.currentBalance + amount;

      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: { currentBalance: newBalance },
      });

      const transaction = await tx.transaction.create({
        data: {
          storeId,
          customerId: customer.id,
          type: 'UDHAAR',
          amount,
          currency: 'INR',
          balanceAfter: newBalance,
          notes,
          referenceDate: transactionDate,
        },
      });

      return {
        customer: updatedCustomer,
        transaction,
        message: `${customer.name} ka ₹${amount} udhaar jud gaya hai. Kul baaki: ₹${newBalance}.`,
      };
    });
  }

  static async recordPayment(
    storeId: string,
    customerName: string,
    amount: number,
    relativeDate?: string,
    paymentMethod?: string,
    notes?: string
  ) {
    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const customer = await CustomerService.findOrCreate(storeId, customerName);
    const transactionDate = relativeDate ? parseRelativeDate(relativeDate) : new Date();

    return await prisma.$transaction(async (tx) => {
      const newBalance = customer.currentBalance - amount;

      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: { currentBalance: newBalance },
      });

      const noteText = [
        paymentMethod ? `Mode: ${paymentMethod}` : null,
        notes,
      ]
        .filter(Boolean)
        .join(' | ');

      const transaction = await tx.transaction.create({
        data: {
          storeId,
          customerId: customer.id,
          type: 'PAYMENT',
          amount,
          currency: 'INR',
          balanceAfter: newBalance,
          notes: noteText || undefined,
          referenceDate: transactionDate,
        },
      });

      return {
        customer: updatedCustomer,
        transaction,
        message: `${customer.name} se ₹${amount} prapt hue. Kul bacha udhaar: ₹${newBalance}.`,
      };
    });
  }

  static async getCustomerTransactions(storeId: string, customerId: string) {
    return prisma.transaction.findMany({
      where: { storeId, customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async getRecent(storeId: string, limit = 20) {
    return prisma.transaction.findMany({
      where: { storeId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
