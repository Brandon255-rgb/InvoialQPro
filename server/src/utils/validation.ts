import { Request } from 'express';
import { z } from 'zod';

// Helper function to parse params
export const getIdParam = (req: Request): string => {
  const id = req.params.id;
  // Optionally, validate UUID format here
  return id;
};

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
}); 