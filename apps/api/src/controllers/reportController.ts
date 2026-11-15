import { Request, Response } from 'express';
import { ReportService } from '../services/reportService';

export class ReportController {
  static async summary(req: Request, res: Response) {
    const storeId = req.storeId!;
    const [sales, udhaar] = await Promise.all([
      ReportService.getTodaySales(storeId),
      ReportService.getTotalPendingUdhaar(storeId),
    ]);

    res.json({
      success: true,
      data: {
        sales,
        udhaar,
      },
    });
  }

  static async customerBalance(req: Request, res: Response) {
    const storeId = req.storeId!;
    const name = req.query.name as string;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }

    const result = await ReportService.getCustomerBalance(storeId, name);
    res.json({ success: true, ...result });
  }

  static async productStock(req: Request, res: Response) {
    const storeId = req.storeId!;
    const name = req.query.name as string;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Product name is required' });
    }

    const result = await ReportService.getProductStock(storeId, name);
    res.json({ success: true, ...result });
  }
}
