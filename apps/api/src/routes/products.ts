import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', ProductController.list);
router.post('/', ProductController.create);
router.get('/:id', ProductController.get);

export default router;
