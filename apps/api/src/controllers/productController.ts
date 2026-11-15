import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { prisma } from '../config/db';

export class ProductController {
  static async list(req: Request, res: Response) {
    const storeId = req.storeId!;
    const query = req.query.q as string;
    const candidates = await ProductService.findCandidates(storeId, query);
    res.json({ success: true, products: candidates });
  }

  static async get(req: Request, res: Response) {
    const storeId = req.storeId!;
    const { id } = req.params;
    const product = await prisma.product.findFirst({
      where: { id, storeId },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, product });
  }

  static async create(req: Request, res: Response) {
    const storeId = req.storeId!;
    const { name, unit, currentStock, minStockAlert, salePrice, costPrice } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Product name is required' });
    }

    const product = await prisma.product.create({
      data: {
        storeId,
        name: name.trim(),
        unit: unit || 'piece',
        currentStock: Number(currentStock) || 0,
        minStockAlert: Number(minStockAlert) || 5,
        salePrice: Number(salePrice) || 0,
        costPrice: Number(costPrice) || 0,
      },
    });

    res.status(201).json({ success: true, product });
  }
}
