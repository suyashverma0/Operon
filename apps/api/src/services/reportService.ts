import { prisma } from '../config/db';
import { CustomerService } from './customerService';
import { ProductService } from './productService';

export class ReportService {
  static async getCustomerBalance(storeId: string, customerName: string) {
    const customer = await CustomerService.findByName(storeId, customerName);
    if (!customer) {
      return {
        found: false,
        message: `Grahak "${customerName}" ka record nahi mila.`,
      };
    }

    return {
      found: true,
      customerName: customer.name,
      balance: customer.currentBalance,
      message: `${customer.name} ka kul baaki udhaar ₹${customer.currentBalance} hai.`,
    };
  }

  static async getProductStock(storeId: string, productName: string) {
    const product = await ProductService.findByName(storeId, productName);
    if (!product) {
      return {
        found: false,
        message: `Product "${productName}" stock mein nahi mila.`,
      };
    }

    return {
      found: true,
      productName: product.name,
      currentStock: product.currentStock,
      unit: product.unit,
      message: `${product.name} ka stock abhi ${product.currentStock} ${product.unit} hai.`,
    };
  }

  static async getTotalPendingUdhaar(storeId: string) {
    const customers = await prisma.customer.findMany({
      where: {
        storeId,
        currentBalance: { gt: 0 },
      },
      select: { currentBalance: true },
    });

    const total = customers.reduce((sum, c) => sum + c.currentBalance, 0);
    return {
      totalPendingUdhaar: total,
      customerCount: customers.length,
      message: `Kul ${customers.length} grahako ka ₹${total} udhaar baaki hai.`,
    };
  }

  static async getTodaySales(storeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const payments = await prisma.transaction.findMany({
      where: {
        storeId,
        type: 'PAYMENT',
        createdAt: { gte: today },
      },
    });

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      todayCollected: totalCollected,
      paymentCount: payments.length,
      message: `Aaj kul ₹${totalCollected} ka payment collection hua hai.`,
    };
  }
}
