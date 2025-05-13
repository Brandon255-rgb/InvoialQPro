import { Client, Invoice, InvoiceItem, InsertClient, InsertInvoice, InsertInvoiceItem } from '@shared/schema';

interface RecurringSchedule {
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
  startDate: Date;
  endDate?: Date;
}

class Api {
  private baseUrl = '/api';

  // Client endpoints
  async getClients(): Promise<Client[]> {
    const response = await fetch(`${this.baseUrl}/clients`);
    if (!response.ok) throw new Error('Failed to get clients');
    return response.json();
  }

  async getClient(id: string): Promise<Client> {
    const response = await fetch(`${this.baseUrl}/clients/${id}`);
    if (!response.ok) throw new Error('Failed to get client');
    return response.json();
  }

  async createClient(client: InsertClient): Promise<Client> {
    const response = await fetch(`${this.baseUrl}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error('Failed to create client');
    return response.json();
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    const response = await fetch(`${this.baseUrl}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error('Failed to update client');
    return response.json();
  }

  async deleteClient(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/clients/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete client');
  }

  // Invoice endpoints
  async getInvoices(): Promise<Invoice[]> {
    const response = await fetch(`${this.baseUrl}/invoices`);
    if (!response.ok) throw new Error('Failed to get invoices');
    return response.json();
  }

  async getInvoice(id: string): Promise<Invoice> {
    const response = await fetch(`${this.baseUrl}/invoices/${id}`);
    if (!response.ok) throw new Error('Failed to get invoice');
    return response.json();
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const response = await fetch(`${this.baseUrl}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });
    if (!response.ok) throw new Error('Failed to create invoice');
    return response.json();
  }

  async createRecurringInvoice(baseInvoice: InsertInvoice, schedule: RecurringSchedule): Promise<Invoice> {
    const response = await fetch(`${this.baseUrl}/invoices/recurring`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseInvoice, schedule }),
    });
    if (!response.ok) throw new Error('Failed to create recurring invoice');
    return response.json();
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const response = await fetch(`${this.baseUrl}/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });
    if (!response.ok) throw new Error('Failed to update invoice');
    return response.json();
  }

  async deleteInvoice(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/invoices/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete invoice');
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    const response = await fetch(`${this.baseUrl}/invoices/${invoiceId}/items`);
    if (!response.ok) throw new Error('Failed to get invoice items');
    return response.json();
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const response = await fetch(`${this.baseUrl}/invoices/${item.invoiceId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to create invoice item');
    return response.json();
  }

  async updateInvoiceItem(id: string, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
    const response = await fetch(`${this.baseUrl}/invoice-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to update invoice item');
    return response.json();
  }

  async deleteInvoiceItem(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/invoice-items/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete invoice item');
  }

  async generateInvoicePdf(id: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/invoices/${id}/pdf`);
    if (!response.ok) throw new Error('Failed to generate PDF');
    return response.blob();
  }

  async sendInvoice(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/invoices/${id}/send`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to send invoice');
  }
}

export const api = new Api(); 