import { Request, Response } from 'express';
import { CustomerService } from '../services/customerService';
import { prisma } from '../config/db';

export class CustomerController {
  static async list(req: Request, res: Response) {
    const storeId = req.storeId!;
    const query = req.query.q as string;
    const candidates = await CustomerService.findCandidates(storeId, query);
    res.json({ success: true, customers: candidates });
  }

  static async get(req: Request, res: Response) {
    const storeId = req.storeId!;
    const { id } = req.params;
    const customer = await prisma.customer.findFirst({
      where: { id, storeId },
      include: { transactions: { take: 20, orderBy: { createdAt: 'desc' } } },
    });

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, customer });
  }

  static async create(req: Request, res: Response) {
    const storeId = req.storeId!;
    const { name, phone, address, notes } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const customer = await prisma.customer.create({
      data: {
        storeId,
        name: name.trim(),
        phone,
        address,
        notes,
      },
    });

    res.status(201).json({ success: true, customer });
  }
}
