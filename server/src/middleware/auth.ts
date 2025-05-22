import { Request, Response, NextFunction } from "express";
import { createClient } from '@supabase/supabase-js';

// Constants
export const SALT_ROUNDS = 12; // Industry standard for bcrypt
export const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        role: string;
      } | undefined;
    }
  }
}

// Authentication middleware using Supabase JWT
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user's role from metadata
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    req.user = {
      id: user.id,
      email: user.email!,
      role: profile.role || 'user'
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Role-based access control middleware
export const requireRole = (allowedRoles: ('super_admin' | 'admin' | 'user')[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!allowedRoles.includes(req.user.role as any)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Audit log middleware
export const auditLog = (req: Request, res: Response, next: NextFunction) => {
  next();
}; 