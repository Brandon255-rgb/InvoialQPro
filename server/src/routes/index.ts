import { Express } from 'express';
import { createServer, type Server } from 'http';
import authRouter from './auth';
import paymentRouter from './payment';
import { auth, auditLog } from '../middleware/auth';

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply global middleware
  app.use(auth);
  app.use(auditLog);

  // Register route modules
  app.use('/api/auth', authRouter);
  app.use('/api/payments', paymentRouter);

  // Create HTTP server
  const server = createServer(app);
  
  return server;
} 