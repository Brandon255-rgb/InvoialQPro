import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user: {
        clientId: string;
        userId: string;
      };
    }
  }
} 