import { Request, Response, NextFunction } from "express";
import { db } from '../db';
import { auditLogs } from '@shared/schema';

// Middleware for audit logging
export const auditLog = async (req: Request, res: Response, next: NextFunction) => {
  // Only log mutating actions
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const user = (req as any).user;
    if (user) {
      await db.insert(auditLogs).values({
        userId: user.id,
        action: req.method + ' ' + req.path,
        entity: req.path.split('/')[2] || '',
        entityId: req.params.id ? Number(req.params.id) : null,
        timestamp: new Date(),
      });
    }
  }
  next();
}; 