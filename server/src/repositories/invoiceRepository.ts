import { Database } from 'sqlite3';
import { Invoice, InsertInvoice, InvoiceItem, InsertInvoiceItem } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';

interface DbInvoice {
  id: string;
  invoice_number: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  status: Invoice['status'];
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  is_recurring: number;
  frequency: Invoice['frequency'] | null;
  next_invoice_date: string | null;
  created_at: string;
  updated_at: string;
}

interface DbInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

export class InvoiceRepository {
  constructor(private db: Database) {}

  async createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    const id = uuidv4();
    const now = new Date();

    await new Promise<void>((resolve, reject) => {
      this.db.run(
        `INSERT INTO invoices (
          id, invoice_number, client_id, issue_date, due_date, status,
          subtotal, tax, total, notes, is_recurring, frequency, next_invoice_date,
          created_at, updated_at
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
          now.toISOString(),
          now.toISOString()
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    for (const item of items) {
      const itemId = uuidv4();
      await new Promise<void>((resolve, reject) => {
        this.db.run(
          `INSERT INTO invoice_items (
            id, invoice_id, description, quantity, unit_price, amount,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            id,
            item.description,
            item.quantity,
            item.unitPrice,
            item.amount,
            now.toISOString(),
            now.toISOString()
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    const result = await this.getInvoiceById(id);
    if (!result) throw new Error('Failed to create invoice');
    return result;
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM invoices WHERE id = ?`,
        [id],
        (err: Error | null, invoice: DbInvoice | undefined) => {
          if (err) {
            reject(err);
            return;
          }

          if (!invoice) {
            resolve(null);
            return;
          }

          this.db.all(
            `SELECT * FROM invoice_items WHERE invoice_id = ?`,
            [id],
            (err: Error | null, items: DbInvoiceItem[]) => {
              if (err) {
                reject(err);
                return;
              }

              resolve({
                id: invoice.id,
                invoiceNumber: invoice.invoice_number,
                clientId: invoice.client_id,
                issueDate: new Date(invoice.issue_date),
                dueDate: new Date(invoice.due_date),
                status: invoice.status,
                subtotal: invoice.subtotal,
                tax: invoice.tax,
                total: invoice.total,
                notes: invoice.notes,
                isRecurring: Boolean(invoice.is_recurring),
                frequency: invoice.frequency,
                nextInvoiceDate: invoice.next_invoice_date ? new Date(invoice.next_invoice_date) : null,
                createdAt: new Date(invoice.created_at),
                updatedAt: new Date(invoice.updated_at),
                items: items.map(item => ({
                  id: item.id,
                  invoiceId: item.invoice_id,
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unit_price,
                  amount: item.amount,
                  createdAt: new Date(item.created_at),
                  updatedAt: new Date(item.updated_at)
                }))
              });
            }
          );
        }
      );
    });
  }

  async getInvoices(): Promise<Invoice[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM invoices ORDER BY created_at DESC`,
        (err: Error | null, invoices: DbInvoice[]) => {
          if (err) {
            reject(err);
            return;
          }

          Promise.all(invoices.map(invoice => this.getInvoiceById(invoice.id)))
            .then(resolve)
            .catch(reject);
        }
      );
    });
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>, items?: InsertInvoiceItem[]): Promise<Invoice> {
    const now = new Date();
    const updates: string[] = [];
    const values: any[] = [];

    if (invoice.invoiceNumber) {
      updates.push('invoice_number = ?');
      values.push(invoice.invoiceNumber);
    }
    if (invoice.clientId) {
      updates.push('client_id = ?');
      values.push(invoice.clientId);
    }
    if (invoice.issueDate) {
      updates.push('issue_date = ?');
      values.push(invoice.issueDate.toISOString());
    }
    if (invoice.dueDate) {
      updates.push('due_date = ?');
      values.push(invoice.dueDate.toISOString());
    }
    if (invoice.status) {
      updates.push('status = ?');
      values.push(invoice.status);
    }
    if (invoice.subtotal !== undefined) {
      updates.push('subtotal = ?');
      values.push(invoice.subtotal);
    }
    if (invoice.tax !== undefined) {
      updates.push('tax = ?');
      values.push(invoice.tax);
    }
    if (invoice.total !== undefined) {
      updates.push('total = ?');
      values.push(invoice.total);
    }
    if (invoice.notes !== undefined) {
      updates.push('notes = ?');
      values.push(invoice.notes);
    }
    if (invoice.isRecurring !== undefined) {
      updates.push('is_recurring = ?');
      values.push(invoice.isRecurring ? 1 : 0);
    }
    if (invoice.frequency !== undefined) {
      updates.push('frequency = ?');
      values.push(invoice.frequency);
    }
    if (invoice.nextInvoiceDate !== undefined) {
      updates.push('next_invoice_date = ?');
      values.push(invoice.nextInvoiceDate?.toISOString());
    }

    updates.push('updated_at = ?');
    values.push(now.toISOString());
    values.push(id);

    await new Promise<void>((resolve, reject) => {
      this.db.run(
        `UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`,
        values,
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    if (items) {
      await new Promise<void>((resolve, reject) => {
        this.db.run(
          `DELETE FROM invoice_items WHERE invoice_id = ?`,
          [id],
          (err: Error | null) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      for (const item of items) {
        const itemId = uuidv4();
        await new Promise<void>((resolve, reject) => {
          this.db.run(
            `INSERT INTO invoice_items (
              id, invoice_id, description, quantity, unit_price, amount,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              id,
              item.description,
              item.quantity,
              item.unitPrice,
              item.amount,
              now.toISOString(),
              now.toISOString()
            ],
            (err: Error | null) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }

    const result = await this.getInvoiceById(id);
    if (!result) throw new Error('Failed to update invoice');
    return result;
  }

  async deleteInvoice(id: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.db.run(
        `DELETE FROM invoice_items WHERE invoice_id = ?`,
        [id],
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    await new Promise<void>((resolve, reject) => {
      this.db.run(
        `DELETE FROM invoices WHERE id = ?`,
        [id],
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getRecurringInvoices(): Promise<Invoice[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM invoices WHERE is_recurring = 1 AND next_invoice_date <= datetime('now')`,
        (err: Error | null, invoices: DbInvoice[]) => {
          if (err) {
            reject(err);
            return;
          }

          Promise.all(invoices.map(invoice => this.getInvoiceById(invoice.id)))
            .then(resolve)
            .catch(reject);
        }
      );
    });
  }
} 