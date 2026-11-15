import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface AuthenticatedUser {
  userId: string;
  storeId: string;
  role?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      storeId?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const devStoreId = req.headers['x-store-id'] as string;

  // In development, if X-Store-Id is provided and no auth header, provide a mock user
  if (!authHeader && devStoreId && ENV.NODE_ENV !== 'production') {
    req.user = {
      userId: 'dev-user-1',
      storeId: devStoreId,
      role: 'OWNER',
      name: 'Shop Owner',
    };
    req.storeId = devStoreId;
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required.',
      code: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required.',
      code: 'UNAUTHORIZED',
    });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET as string) as unknown as AuthenticatedUser;
    req.user = decoded;
    req.storeId = decoded.storeId;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.',
      code: 'INVALID_TOKEN',
    });
  }
}
