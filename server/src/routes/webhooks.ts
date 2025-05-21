import { Router } from 'express';
import { handleStripeWebhook } from '../services/stripe';

const router = Router();

router.post('/stripe', async (req, res) => {
  try {
    await handleStripeWebhook(req);
    res.json({ received: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Webhook error:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router; 