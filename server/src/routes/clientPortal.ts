import { Router } from 'express';
import { db } from '../db/schema';
import { invoices, clients } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createPaymentIntent } from '../services/payment';

const router = Router();

// Get client's invoices
router.get('/invoices', async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const clientInvoices = await db.query.invoices.findMany({
      where: eq(invoices.clientId, clientId),
      with: {
        items: true,
      },
    });
    res.json(clientInvoices);
  } catch (error) {
    console.error('Error fetching client invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get single invoice
router.get('/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.clientId;
    
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
      with: {
        items: true,
      },
    });

    if (!invoice || invoice.clientId !== clientId) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create payment intent
router.post('/invoices/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.clientId;

    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
    });

    if (!invoice || invoice.clientId !== clientId) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const { clientSecret, paymentIntentId } = await createPaymentIntent(invoice);
    res.json({ clientSecret, paymentIntentId });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Update client profile
router.put('/profile', async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const { name, email, phone, address } = req.body;

    const updatedClient = await db.update(clients)
      .set({ name, email, phone, address })
      .where(eq(clients.id, clientId))
      .returning();

    res.json(updatedClient[0]);
  } catch (error) {
    console.error('Error updating client profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router; 