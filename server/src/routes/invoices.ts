import { Router } from 'express';
import { auth } from '../middleware/auth';
import { db } from '../lib/db';
import { invoices, invoiceItems, items, clients } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Get all invoices with their items and client info
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const allInvoices = await db.query.invoices.findMany({
      where: eq(invoices.userId, userId),
      with: {
        items: {
          with: {
            item: true,
          },
        },
        client: true,
      },
      orderBy: [desc(invoices.createdAt)],
    });

    res.json(allInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get a single invoice with all details
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoice = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, id),
        eq(invoices.userId, userId)
      ),
      with: {
        items: {
          with: {
            item: true,
          },
        },
        client: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create a new invoice
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      clientId,
      invoiceNumber,
      issueDate,
      dueDate,
      items: invoiceItems,
      notes,
      terms,
      status = 'draft',
    } = req.body;

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Create the invoice
      const [newInvoice] = await tx.insert(invoices).values({
        clientId,
        userId,
        invoiceNumber,
        issueDate,
        dueDate,
        notes,
        terms,
        status,
      }).returning();

      // Create invoice items
      if (invoiceItems && invoiceItems.length > 0) {
        await tx.insert(invoiceItems).values(
          invoiceItems.map((item: any) => ({
            invoiceId: newInvoice.id,
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            description: item.description,
          }))
        );
      }

      // Fetch the complete invoice with relations
      return await tx.query.invoices.findFirst({
        where: eq(invoices.id, newInvoice.id),
        with: {
          items: {
            with: {
              item: true,
            },
          },
          client: true,
        },
      });
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Update an invoice
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      clientId,
      invoiceNumber,
      issueDate,
      dueDate,
      items: invoiceItems,
      notes,
      terms,
      status,
    } = req.body;

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Update the invoice
      const [updatedInvoice] = await tx.update(invoices)
        .set({
          clientId,
          invoiceNumber,
          issueDate,
          dueDate,
          notes,
          terms,
          status,
        })
        .where(and(
          eq(invoices.id, id),
          eq(invoices.userId, userId)
        ))
        .returning();

      if (!updatedInvoice) {
        throw new Error('Invoice not found');
      }

      // Delete existing items
      await tx.delete(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id));

      // Create new items
      if (invoiceItems && invoiceItems.length > 0) {
        await tx.insert(invoiceItems).values(
          invoiceItems.map((item: any) => ({
            invoiceId: id,
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            description: item.description,
          }))
        );
      }

      // Fetch the complete invoice with relations
      return await tx.query.invoices.findFirst({
        where: eq(invoices.id, id),
        with: {
          items: {
            with: {
              item: true,
            },
          },
          client: true,
        },
      });
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating invoice:', error);
    if (error.message === 'Invoice not found') {
      res.status(404).json({ error: 'Invoice not found' });
    } else {
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  }
});

// Delete an invoice
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Start a transaction
    await db.transaction(async (tx) => {
      // Delete invoice items first
      await tx.delete(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id));

      // Delete the invoice
      const [deletedInvoice] = await tx.delete(invoices)
        .where(and(
          eq(invoices.id, id),
          eq(invoices.userId, userId)
        ))
        .returning();

      if (!deletedInvoice) {
        throw new Error('Invoice not found');
      }
    });

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    if (error.message === 'Invoice not found') {
      res.status(404).json({ error: 'Invoice not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete invoice' });
    }
  }
});

// Get invoice statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const allInvoices = await db.query.invoices.findMany({
      where: eq(invoices.userId, userId),
    });

    const stats = {
      totalInvoices: allInvoices.length,
      totalRevenue: allInvoices.reduce((sum, inv) => sum + Number(inv.total), 0),
      paidInvoices: allInvoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: allInvoices.filter(inv => inv.status === 'pending').length,
      overdueInvoices: allInvoices.filter(inv => inv.status === 'overdue').length,
      draftInvoices: allInvoices.filter(inv => inv.status === 'draft').length,
      averageInvoiceAmount: allInvoices.length > 0
        ? allInvoices.reduce((sum, inv) => sum + Number(inv.total), 0) / allInvoices.length
        : 0,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({ error: 'Failed to fetch invoice statistics' });
  }
});

export default router; 