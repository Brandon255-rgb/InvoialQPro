import { Router } from 'express';
import { auth } from '../middleware/auth';
import { db } from '../lib/db';
import { clients, invoices, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Get all clients with their invoices
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const allClients = await db.query.clients.findMany({
      where: eq(clients.userId, userId),
      with: {
        invoices: {
          orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
          limit: 5, // Get only the 5 most recent invoices
        },
      },
    });

    res.json(allClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get a single client with all their invoices
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const client = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, parseInt(id)),
        eq(clients.userId, userId)
      ),
      with: {
        invoices: {
          orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create a new client
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, company, phone, address, notes } = req.body;

    const newClient = await db.insert(clients).values({
      name,
      email,
      company,
      phone,
      address,
      notes,
      userId,
    }).returning();

    res.status(201).json(newClient[0]);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update a client
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, email, company, phone, address, notes } = req.body;

    const updatedClient = await db.update(clients)
      .set({
        name,
        email,
        company,
        phone,
        address,
        notes,
      })
      .where(and(
        eq(clients.id, parseInt(id)),
        eq(clients.userId, userId)
      ))
      .returning();

    if (!updatedClient.length) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(updatedClient[0]);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Delete a client
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if client has any invoices
    const clientInvoices = await db.query.invoices.findMany({
      where: and(
        eq(invoices.clientId, parseInt(id)),
        eq(invoices.userId, userId)
      ),
    });

    if (clientInvoices.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete client with existing invoices',
        invoiceCount: clientInvoices.length,
      });
    }

    const deletedClient = await db.delete(clients)
      .where(and(
        eq(clients.id, parseInt(id)),
        eq(clients.userId, userId)
      ))
      .returning();

    if (!deletedClient.length) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Get client statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const clientInvoices = await db.query.invoices.findMany({
      where: and(
        eq(invoices.clientId, parseInt(id)),
        eq(invoices.userId, userId)
      ),
    });

    const stats = {
      totalInvoices: clientInvoices.length,
      totalRevenue: clientInvoices.reduce((sum, inv) => sum + Number(inv.total), 0),
      paidInvoices: clientInvoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: clientInvoices.filter(inv => inv.status === 'pending').length,
      overdueInvoices: clientInvoices.filter(inv => inv.status === 'overdue').length,
      averageInvoiceAmount: clientInvoices.length > 0
        ? clientInvoices.reduce((sum, inv) => sum + Number(inv.total), 0) / clientInvoices.length
        : 0,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({ error: 'Failed to fetch client statistics' });
  }
});

export default router; 