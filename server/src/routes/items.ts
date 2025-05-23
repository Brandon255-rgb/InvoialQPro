import { Router } from 'express';
import { auth } from '../middleware/auth';
import { db } from '../lib/db';
import { items, invoiceItems } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Get all items
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const allItems = await db.query.items.findMany({
      where: eq(items.userId, userId),
    });

    res.json(allItems);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get a single item
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const item = await db.query.items.findFirst({
      where: and(
        eq(items.id, parseInt(id)),
        eq(items.userId, userId)
      ),
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create a new item
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, unitPrice, unit, taxRate } = req.body;

    const [newItem] = await db.insert(items).values({
      name,
      description,
      unitPrice,
      unit,
      taxRate,
      userId,
    }).returning();

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update an item
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, unitPrice, unit, taxRate } = req.body;

    const [updatedItem] = await db.update(items)
      .set({
        name,
        description,
        unitPrice,
        unit,
        taxRate,
      })
      .where(and(
        eq(items.id, parseInt(id)),
        eq(items.userId, userId)
      ))
      .returning();

    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete an item
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if item is used in any invoices
    const itemInvoices = await db.query.invoiceItems.findMany({
      where: eq(invoiceItems.itemId, parseInt(id)),
    });

    if (itemInvoices.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete item that is used in invoices',
        invoiceCount: itemInvoices.length,
      });
    }

    const [deletedItem] = await db.delete(items)
      .where(and(
        eq(items.id, parseInt(id)),
        eq(items.userId, userId)
      ))
      .returning();

    if (!deletedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Get item usage statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const itemInvoices = await db.query.invoiceItems.findMany({
      where: eq(invoiceItems.itemId, parseInt(id)),
      with: {
        invoice: true,
      },
    });

    const stats = {
      totalUsage: itemInvoices.length,
      totalQuantity: itemInvoices.reduce((sum, inv) => sum + Number(inv.quantity), 0),
      totalRevenue: itemInvoices.reduce((sum, inv) => sum + (Number(inv.quantity) * Number(inv.unitPrice)), 0),
      averageQuantity: itemInvoices.length > 0
        ? itemInvoices.reduce((sum, inv) => sum + Number(inv.quantity), 0) / itemInvoices.length
        : 0,
      lastUsed: itemInvoices.length > 0
        ? Math.max(...itemInvoices.map(inv => new Date(inv.invoice.createdAt).getTime()))
        : null,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching item stats:', error);
    res.status(500).json({ error: 'Failed to fetch item statistics' });
  }
});

export default router; 