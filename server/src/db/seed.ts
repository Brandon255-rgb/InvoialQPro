import { db } from './index';
import { users, clients, items, invoices, invoiceItems, teamMembers } from '@shared/schema';
import { hash } from 'bcrypt';

async function seed() {
  // Users
  const password = await hash('password123', 10);
  const [admin] = await db.insert(users).values({
    email: 'admin@invoialqpro.com',
    password,
    name: 'Admin User',
    role: 'super_admin',
    status: 'active',
    company: 'InvoialQPro',
    phone: '1234567890',
    address: '123 Main St',
  }).returning();

  const [user] = await db.insert(users).values({
    email: 'user@invoialqpro.com',
    password,
    name: 'Regular User',
    role: 'user',
    status: 'active',
    company: 'UserCo',
    phone: '9876543210',
    address: '456 Side St',
  }).returning();

  // Clients
  const [client] = await db.insert(clients).values({
    userId: admin.id,
    name: 'Acme Corp',
    email: 'acme@example.com',
    company: 'Acme Corp',
    phone: '555-1234',
    address: '789 Client Ave',
    notes: 'VIP client',
  }).returning();

  // Items
  const [item] = await db.insert(items).values({
    userId: admin.id,
    name: 'Consulting',
    description: 'Consulting services',
    price: 1000,
    category: 'Services',
    isInventory: false,
    stockQuantity: 0,
  }).returning();

  // Invoices
  const [invoice] = await db.insert(invoices).values({
    userId: admin.id,
    clientId: client.id,
    invoiceNumber: 'INV-1001',
    status: 'sent',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    subtotal: 1000,
    tax: 100,
    discount: 0,
    total: 1100,
    notes: 'Thank you for your business!',
    isRecurring: false,
  }).returning();

  // Invoice Items
  await db.insert(invoiceItems).values({
    invoiceId: invoice.id,
    itemId: item.id,
    description: 'Consulting',
    quantity: 1,
    price: 1000,
    total: 1000,
  });

  // Team Members
  await db.insert(teamMembers).values({
    userId: admin.id,
    invitedBy: admin.id,
    email: 'user@invoialqpro.com',
    role: 'user',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Seed data inserted successfully');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
}); 