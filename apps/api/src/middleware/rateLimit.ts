import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const windowMs = 60 * 1000; // 1 minute
const maxRequests = 100;
const ipMap = new Map<string, RateLimitRecord>();

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = ipMap.get(ip);
  if (!record || record.resetAt <= now) {
    ipMap.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again after a minute.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  record.count += 1;
  next();
}
