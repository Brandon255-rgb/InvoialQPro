import { Client, Invoice, InvoiceItem, InsertClient, InsertInvoice, InsertInvoiceItem } from '@shared/schema';
import { Database } from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Storage {
  private db: Database | null = null;

  async init() {
    this.db = await open({
      filename: resolve(__dirname, '../../data/invoices.db'),
      driver: Database
    });

    await this.createTables();
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        taxId TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoiceNumber TEXT NOT NULL,
        clientId TEXT NOT NULL,
        issueDate TEXT NOT NULL,
        dueDate TEXT NOT NULL,
        status TEXT NOT NULL,
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        total REAL NOT NULL,
        notes TEXT,
        isRecurring INTEGER NOT NULL DEFAULT 0,
        frequency TEXT,
        nextInvoiceDate TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (clientId) REFERENCES clients (id)
      );

      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        invoiceId TEXT NOT NULL,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        amount REAL NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (invoiceId) REFERENCES invoices (id)
      );
    `);
  }

  // Client methods
  async createClient(client: InsertClient): Promise<Client> {
    if (!this.db) throw new Error('Database not initialized');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO clients (id, name, email, phone, address, taxId, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, client.name, client.email, client.phone, client.address, client.taxId, client.notes, now, now]
    );

    return this.getClient(id);
  }

  async getClient(id: string): Promise<Client | null> {
    if (!this.db) throw new Error('Database not initialized');

    const client = await this.db.get('SELECT * FROM clients WHERE id = ?', [id]);
    if (!client) return null;

    return {
      ...client,
      createdAt: new Date(client.createdAt),
      updatedAt: new Date(client.updatedAt)
    };
  }

  async getClients(): Promise<Client[]> {
    if (!this.db) throw new Error('Database not initialized');

    const clients = await this.db.all('SELECT * FROM clients ORDER BY name');
    return clients.map(client => ({
      ...client,
      createdAt: new Date(client.createdAt),
      updatedAt: new Date(client.updatedAt)
    }));
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const updates = Object.entries(client)
      .filter(([_, value]) => value !== undefined)
      .map(([key]) => `${key} = ?`)
      .join(', ');

    const values = [...Object.values(client).filter(v => v !== undefined), now, id];

    await this.db.run(
      `UPDATE clients SET ${updates}, updatedAt = ? WHERE id = ?`,
      values
    );

    return this.getClient(id);
  }

  async deleteClient(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run('DELETE FROM clients WHERE id = ?', [id]);
  }

  // Invoice methods
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    if (!this.db) throw new Error('Database not initialized');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO invoices (
        id, invoiceNumber, clientId, issueDate, dueDate, status,
        subtotal, tax, total, notes, isRecurring, frequency, nextInvoiceDate,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        invoice.invoiceNumber,
        invoice.clientId,
        invoice.issueDate.toISOString(),
        invoice.dueDate.toISOString(),
        invoice.status,
        invoice.subtotal,
        invoice.tax,
        invoice.total,
        invoice.notes,
        invoice.isRecurring ? 1 : 0,
        invoice.frequency,
        invoice.nextInvoiceDate?.toISOString(),
        now,
        now
      ]
    );

    return this.getInvoice(id);
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    if (!this.db) throw new Error('Database not initialized');

    const invoice = await this.db.get('SELECT * FROM invoices WHERE id = ?', [id]);
    if (!invoice) return null;

    return {
      ...invoice,
      isRecurring: Boolean(invoice.isRecurring),
      issueDate: new Date(invoice.issueDate),
      dueDate: new Date(invoice.dueDate),
      nextInvoiceDate: invoice.nextInvoiceDate ? new Date(invoice.nextInvoiceDate) : undefined,
      createdAt: new Date(invoice.createdAt),
      updatedAt: new Date(invoice.updatedAt)
    };
  }

  async getInvoices(): Promise<Invoice[]> {
    if (!this.db) throw new Error('Database not initialized');

    const invoices = await this.db.all('SELECT * FROM invoices ORDER BY issueDate DESC');
    return invoices.map(invoice => ({
      ...invoice,
      isRecurring: Boolean(invoice.isRecurring),
      issueDate: new Date(invoice.issueDate),
      dueDate: new Date(invoice.dueDate),
      nextInvoiceDate: invoice.nextInvoiceDate ? new Date(invoice.nextInvoiceDate) : undefined,
      createdAt: new Date(invoice.createdAt),
      updatedAt: new Date(invoice.updatedAt)
    }));
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const updates = Object.entries(invoice)
      .filter(([_, value]) => value !== undefined)
      .map(([key]) => `${key} = ?`)
      .join(', ');

    const values = [...Object.values(invoice).filter(v => v !== undefined), now, id];

    await this.db.run(
      `UPDATE invoices SET ${updates}, updatedAt = ? WHERE id = ?`,
      values
    );

    return this.getInvoice(id);
  }

  async deleteInvoice(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run('DELETE FROM invoices WHERE id = ?', [id]);
  }

  // Invoice item methods
  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    if (!this.db) throw new Error('Database not initialized');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO invoice_items (id, invoiceId, description, quantity, unitPrice, amount, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, item.invoiceId, item.description, item.quantity, item.unitPrice, item.amount, now, now]
    );

    return this.getInvoiceItem(id);
  }

  async getInvoiceItem(id: string): Promise<InvoiceItem | null> {
    if (!this.db) throw new Error('Database not initialized');

    const item = await this.db.get('SELECT * FROM invoice_items WHERE id = ?', [id]);
    if (!item) return null;

    return {
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    };
  }

  async getInvoiceItemsByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const items = await this.db.all('SELECT * FROM invoice_items WHERE invoiceId = ?', [invoiceId]);
    return items.map(item => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }));
  }

  async updateInvoiceItem(id: string, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const updates = Object.entries(item)
      .filter(([_, value]) => value !== undefined)
      .map(([key]) => `${key} = ?`)
      .join(', ');

    const values = [...Object.values(item).filter(v => v !== undefined), now, id];

    await this.db.run(
      `UPDATE invoice_items SET ${updates}, updatedAt = ? WHERE id = ?`,
      values
    );

    return this.getInvoiceItem(id);
  }

  async deleteInvoiceItem(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run('DELETE FROM invoice_items WHERE id = ?', [id]);
  }
}

export const storage = new Storage(); 