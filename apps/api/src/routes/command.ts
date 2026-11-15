import { Router } from 'express';
import { CommandController } from '../controllers/commandController';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { rateLimiter } from '../middleware/rateLimit';

const router = Router();

// Decoupled parsing route (AI only, no DB writes)
router.post('/parse', rateLimiter, authMiddleware, tenantMiddleware, CommandController.parse);

// Decoupled execution route (Strict DB transaction after user confirmation or review)
router.post('/execute', rateLimiter, authMiddleware, tenantMiddleware, CommandController.execute);

// Unified end-to-end command route
router.post('/process', rateLimiter, authMiddleware, tenantMiddleware, CommandController.process);

export default router;
