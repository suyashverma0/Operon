import { Request, Response, NextFunction } from 'express';

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const storeId = req.user?.storeId || (req.headers['x-store-id'] as string) || req.query.storeId;

  if (!storeId || typeof storeId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Tenant Store ID could not be resolved.',
      code: 'MISSING_TENANT_ID',
    });
  }

  req.storeId = storeId;
  next();
}
