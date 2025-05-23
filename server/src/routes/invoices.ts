import { Router } from 'express';
import { auth } from '../middleware/auth';
import { db } from '../lib/db';
import { invoices, invoiceItems, items, clients, users } from '../lib/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Get all invoices with their items and client info
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // First verify the user exists in our database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    const allInvoices = await db.query.invoices.findMany({
      where: eq(invoices.user_id, userId),
      with: {
        items: {
          with: {
            item: true
          }
        },
        client: true,
      },
      orderBy: [desc(invoices.created_at)],
    });

    // Transform the data to match the expected format
    const transformedInvoices = allInvoices.map(invoice => ({
      id: invoice.id,
      clientId: invoice.client_id,
      invoiceNumber: invoice.invoice_number,
      status: invoice.status,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount),
      total: Number(invoice.total),
      notes: invoice.notes,
      createdAt: invoice.created_at,
      client: invoice.client ? {
        id: invoice.client.id,
        name: invoice.client.name,
        email: invoice.client.email,
        company: invoice.client.company
      } : null,
      items: invoice.items.map(item => ({
        id: item.id,
        itemId: item.item_id,
        description: item.description,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.total),
        item: item.item ? {
          id: item.item.id,
          name: item.item.name,
          description: item.item.description,
          price: Number(item.item.price)
        } : null
      }))
    }));

    res.json(transformedInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    // Provide more detailed error information
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Failed to fetch invoices',
        details: error.message,
        code: error.name
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
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
        eq(invoices.user_id, userId)
      ),
      with: {
        items: true,
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
      client_id,
      invoice_number,
      issue_date,
      due_date,
      items: invoiceItems,
      notes,
      terms,
      status = 'draft',
      subtotal,
      tax,
      total,
    } = req.body;

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Create the invoice
      const [newInvoice] = await tx.insert(invoices).values({
        client_id,
        user_id: userId,
        invoice_number,
        issue_date,
        due_date,
        notes,
        terms,
        status,
        subtotal,
        tax,
        total,
      }).returning();

      // Create invoice items
      if (invoiceItems && invoiceItems.length > 0) {
        await tx.insert(invoiceItems).values(
          invoiceItems.map((item: any) => ({
            invoice_id: newInvoice.id,
            item_id: item.item_id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            user_id: userId,
          }))
        );
      }

      // Fetch the complete invoice with relations
      return await tx.query.invoices.findFirst({
        where: eq(invoices.id, newInvoice.id),
        with: {
          items: true,
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
      client_id,
      invoice_number,
      issue_date,
      due_date,
      items: invoiceItems,
      notes,
      terms,
      status,
      subtotal,
      tax,
      total,
    } = req.body;

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Update the invoice
      const [updatedInvoice] = await tx.update(invoices)
        .set({
          client_id,
          invoice_number,
          issue_date,
          due_date,
          notes,
          terms,
          status,
          subtotal,
          tax,
          total,
        })
        .where(and(
          eq(invoices.id, id),
          eq(invoices.user_id, userId)
        ))
        .returning();

      if (!updatedInvoice) {
        throw new Error('Invoice not found');
      }

      // Delete existing items
      await tx.delete(invoiceItems)
        .where(eq(invoiceItems.invoice_id, id));

      // Create new items
      if (invoiceItems && invoiceItems.length > 0) {
        await tx.insert(invoiceItems).values(
          invoiceItems.map((item: any) => ({
            invoice_id: id,
            item_id: item.item_id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            user_id: userId,
          }))
        );
      }

      // Fetch the complete invoice with relations
      return await tx.query.invoices.findFirst({
        where: eq(invoices.id, id),
        with: {
          items: true,
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
        .where(eq(invoiceItems.invoice_id, id));

      // Delete the invoice
      const [deletedInvoice] = await tx.delete(invoices)
        .where(and(
          eq(invoices.id, id),
          eq(invoices.user_id, userId)
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
      where: eq(invoices.user_id, userId),
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