import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', TransactionController.list);
router.post('/udhaar', TransactionController.addUdhaar);
router.post('/payment', TransactionController.recordPayment);

export default router;
