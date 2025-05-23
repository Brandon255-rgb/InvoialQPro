import { Router } from 'express';
import authRoutes from './auth';
import clientRoutes from './clients';
import invoiceRoutes from './invoices';
import itemRoutes from './items';
import subscriptionRoutes from './subscriptions';
import teamRoutes from './team';
import analyticsRoutes from './analytics';
import userRoutes from './users';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/items', itemRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/team', teamRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', userRoutes);

export default router; 