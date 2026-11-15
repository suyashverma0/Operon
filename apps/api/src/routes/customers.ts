import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', CustomerController.list);
router.post('/', CustomerController.create);
router.get('/:id', CustomerController.get);

export default router;
