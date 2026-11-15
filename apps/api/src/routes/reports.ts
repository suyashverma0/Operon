import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/summary', ReportController.summary);
router.get('/balance', ReportController.customerBalance);
router.get('/stock', ReportController.productStock);

export default router;
