import { Request } from 'express';
import { z } from 'zod';

// Helper function to parse params
export const getIdParam = (req: Request): number => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new Error("Invalid ID parameter");
  }
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