import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { generateInvoicePdf } from '../services/pdf';
import { sendInvoiceEmail } from '../services/email';
import { createRecurringInvoice } from '../services/recurring';

const router = Router();

// Get all invoices
router.get('/', async (req: Request, res: Response) => {
  try {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

// Get a single invoice
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const invoice = await storage.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    console.error('Error getting invoice:', error);
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

// Create a new invoice
router.post('/', async (req: Request, res: Response) => {
  try {
    const invoice = await storage.createInvoice(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Create a recurring invoice
router.post('/recurring', async (req: Request, res: Response) => {
  try {
    const { baseInvoice, schedule } = req.body;
    const invoice = await createRecurringInvoice(baseInvoice, schedule);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating recurring invoice:', error);
    res.status(500).json({ error: 'Failed to create recurring invoice' });
  }
});

// Update an invoice
router.put('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const invoice = await storage.updateInvoice(req.params.id, req.body);
    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Delete an invoice
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    await storage.deleteInvoice(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// Generate PDF for an invoice
router.get('/:id/pdf', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const invoice = await storage.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const client = await storage.getClient(invoice.clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const items = await storage.getInvoiceItemsByInvoiceId(invoice.id);
    const pdfBuffer = await generateInvoicePdf(invoice, client, items);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Send invoice via email
router.post('/:id/send', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const invoice = await storage.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const client = await storage.getClient(invoice.clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const items = await storage.getInvoiceItemsByInvoiceId(invoice.id);
    const pdfBuffer = await generateInvoicePdf(invoice, client, items);
    await sendInvoiceEmail(invoice, client, pdfBuffer);

    // Update invoice status to 'sent'
    await storage.updateInvoice(invoice.id, { status: 'sent' });

    res.json({ message: 'Invoice sent successfully' });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

export default router; 