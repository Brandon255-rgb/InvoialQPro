import { Router } from 'express';
import { db, schema } from '../lib/db';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import { generateToken, verifyToken } from '../lib/auth';
import { insertUserSchema } from '@shared/schema';
import type { User } from '@shared/schema';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to convert database user to shared schema type
function convertToSharedUser(dbUser: typeof schema.users.$inferSelect): User {
  return {
    id: String(dbUser.id),
    email: dbUser.email,
    password: dbUser.password || '',
    name: dbUser.name || '',
    role: dbUser.role || 'user',
    status: dbUser.status || 'active',
    company: dbUser.company ?? null,
    phone: dbUser.phone ?? null,
    address: dbUser.address ?? null,
    created_at: dbUser.created_at || new Date(),
  };
}

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    const validatedData = insertUserSchema.parse({ email, password, name });

    // Create user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Create user in our database
    const [dbUser] = await db.insert(schema.users).values({
      id: authData.user.id,
      email: validatedData.email,
      name: validatedData.name,
      role: 'user' as const,
      status: 'active' as const,
      company: validatedData.company,
      phone: validatedData.phone,
      address: validatedData.address,
    }).returning();

    // Convert to shared schema type
    const user = convertToSharedUser(dbUser);

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user from our database
    const dbUser = await db.query.users.findFirst({
      where: eq(schema.users.id, authData.user.id),
    });

    if (!dbUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (dbUser.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' });
    }

    // Convert to shared schema type
    const user = convertToSharedUser(dbUser);

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      user,
      token,
    });
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Sign out
router.post('/signout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Error signing out:', error);
    res.status(500).json({ error: 'Failed to sign out' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, decoded.id),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get current user' });
  }
});

// Request password reset
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ error: 'Failed to request password reset' });
  }
});

// Update password
router.post('/update-password', async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router; 