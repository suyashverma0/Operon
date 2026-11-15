import { Request, Response } from 'express';
import { TransactionService } from '../services/transactionService';

export class TransactionController {
  static async list(req: Request, res: Response) {
    const storeId = req.storeId!;
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const transactions = await TransactionService.getRecent(storeId, limit);
    res.json({ success: true, transactions });
  }

  static async addUdhaar(req: Request, res: Response) {
    const storeId = req.storeId!;
    const { customerName, amount, relativeDate, notes } = req.body;

    if (!customerName || !amount) {
      return res.status(400).json({ success: false, error: 'Customer name and amount are required' });
    }

    const result = await TransactionService.addUdhaar(
      storeId,
      customerName,
      Number(amount),
      relativeDate,
      notes
    );
    res.status(201).json({ success: true, ...result });
  }

  static async recordPayment(req: Request, res: Response) {
    const storeId = req.storeId!;
    const { customerName, amount, relativeDate, paymentMethod, notes } = req.body;

    if (!customerName || !amount) {
      return res.status(400).json({ success: false, error: 'Customer name and amount are required' });
    }

    const result = await TransactionService.recordPayment(
      storeId,
      customerName,
      Number(amount),
      relativeDate,
      paymentMethod,
      notes
    );
    res.status(201).json({ success: true, ...result });
  }
}
