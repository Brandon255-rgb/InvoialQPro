import { Request, Response, NextFunction } from "express";
import { createClient } from '@supabase/supabase-js';
import { db } from '../lib/db';
import { users } from '../lib/schema';
import { eq } from 'drizzle-orm';

// Constants
export const SALT_ROUNDS = 12; // Industry standard for bcrypt
export const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
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
    const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);

    if (verifyError) {
      console.error('Token verification error:', verifyError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get user's role from metadata
    const role = user.user_metadata?.role || 'user';

    try {
      // Verify user exists in our database
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id)
      });

      if (!dbUser) {
        // Create user in our database if they don't exist
        await db.insert(users).values({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || '',
          role: role,
          created_at: new Date(),
          updated_at: new Date()
        }).onConflictDoNothing();
      }

      req.user = {
        id: user.id,
        email: user.email!,
        role
      };

      next();
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Database error occurred' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Audit log middleware
export const auditLog = (req: Request, res: Response, next: NextFunction) => {
  next();
}; 