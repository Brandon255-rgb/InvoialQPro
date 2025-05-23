import { Router } from 'express';
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

// Helper function to convert Supabase user to shared schema type
function convertToSharedUser(supabaseUser: any): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    password: '', // Don't expose password
    name: supabaseUser.user_metadata?.name || '',
    role: supabaseUser.user_metadata?.role || 'user',
    status: supabaseUser.user_metadata?.status || 'active',
    company: supabaseUser.user_metadata?.company || null,
    phone: supabaseUser.user_metadata?.phone || null,
    address: supabaseUser.user_metadata?.address || null,
    created_at: new Date(supabaseUser.created_at),
  };
}

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, company, phone, address } = req.body;

    // Validate input
    const validatedData = insertUserSchema.parse({ 
      email, 
      password, 
      name,
      company,
      phone,
      address
    });

    // Create user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
          company: validatedData.company,
          phone: validatedData.phone,
          address: validatedData.address,
          role: 'user',
          status: 'active'
        }
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Convert to shared schema type
    const user = convertToSharedUser(authData.user);

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    console.error('Error signing up:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
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

    // Get user metadata from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(authData.session.access_token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Failed to get user data' });
    }

    // Convert to shared schema type
    const sharedUser = convertToSharedUser(user);

    // Generate JWT token
    const token = generateToken(sharedUser);

    res.json({
      user: sharedUser,
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

    // Get user from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Failed to get user data' });
    }

    // Convert to shared schema type
    const sharedUser = convertToSharedUser(user);

    res.json(sharedUser);
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