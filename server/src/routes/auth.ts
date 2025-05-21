import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { storage } from '../../storage';
import { SALT_ROUNDS, TOKEN_EXPIRY } from '../middleware/auth';
import { insertUserSchema } from '@shared/schema';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Registration route
router.post("/register", async (req: Request, res: Response) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    
    // Check if email already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    
    // Create user with hashed password
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword
    });
    
    // Don't return the password in the response
    const { password, ...userWithoutPassword } = user;
    
    res.status(201).json({
      ...userWithoutPassword,
      token: Date.now() + TOKEN_EXPIRY
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      });
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

// Login route
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      // Use generic error message to prevent email enumeration
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Compare password with hashed password in database
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Check if user account is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        message: "Account is not active", 
        status: user.status 
      });
    }
    
    // Don't return the password in the response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      ...userWithoutPassword,
      token: Date.now() + TOKEN_EXPIRY
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      });
    }
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

export default router; 