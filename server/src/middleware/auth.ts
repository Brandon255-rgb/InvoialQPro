import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { storage } from '../../storage';

// Constants
export const SALT_ROUNDS = 12; // Industry standard for bcrypt
export const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Authentication middleware
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(Number(userId));
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Authentication error" });
  }
};

// JWT Authentication middleware
export const auth = (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}; 