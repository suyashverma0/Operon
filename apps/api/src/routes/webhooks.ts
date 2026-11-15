import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

router.post('/whatsapp', (req: Request, res: Response) => {
  logger.info('WhatsApp webhook received:', req.body);
  res.status(200).send('EVENT_RECEIVED');
});

router.post('/payment-gateway', (req: Request, res: Response) => {
  logger.info('Payment gateway webhook received:', req.body);
  res.status(200).json({ status: 'success' });
});

export default router;
