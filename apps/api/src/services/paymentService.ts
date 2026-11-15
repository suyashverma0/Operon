import { TransactionService } from './transactionService';

export class PaymentService {
  static async processPayment(
    storeId: string,
    customerName: string,
    amount: number,
    paymentMethod = 'cash',
    notes?: string
  ) {
    return TransactionService.recordPayment(storeId, customerName, amount, undefined, paymentMethod, notes);
  }
}
