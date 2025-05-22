import { Invoice, InsertInvoice, invoiceFrequencyEnum, InvoiceItem, Client } from '@shared/schema';
import { supabaseAdmin } from '../lib/supabase';
import { generateInvoicePdf } from './pdf';
import { sendInvoiceEmail } from './email';
import { addDays, addMonths, addQuarters, addYears } from 'date-fns';

function calculateNextInvoiceDate(currentDate: Date, frequency: string): Date {
  switch (frequency) {
    case 'weekly':
      return addDays(currentDate, 7);
    case 'biweekly':
      return addDays(currentDate, 14);
    case 'monthly':
      return addMonths(currentDate, 1);
    case 'quarterly':
      return addQuarters(currentDate, 1);
    case 'annually':
      return addYears(currentDate, 1);
    default:
      return addMonths(currentDate, 1);
  }
}

function generateNextInvoiceNumber(currentNumber: string): string {
  const match = currentNumber.match(/(\d+)$/);
  if (match) {
    const number = parseInt(match[1]) + 1;
    return currentNumber.replace(/\d+$/, number.toString().padStart(match[1].length, '0'));
  }
  return `${currentNumber}-1`;
}

export async function processRecurringInvoices(): Promise<void> {
  const today = new Date();
  
  type RecurringInvoice = {
    id: string;
    user_id: string;
    client_id: string;
    invoice_number: string;
    frequency: string;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    notes: string | null;
    items: Array<{
      id: string;
      invoice_id: string;
      item_id: string | null;
      description: string;
      quantity: number;
      price: number;
      total: number;
      created_at: string;
    }>;
    client: {
      id: string;
      user_id: string;
      name: string;
      email: string;
      phone: string | null;
      company: string | null;
      address: string | null;
      notes: string | null;
      created_at: string;
    };
  };

  // Get all recurring invoices that are due for generation
  const { data: recurringInvoices, error: fetchError } = await supabaseAdmin
    .from('invoices')
    .select(`
      *,
      client:clients(*),
      items:invoice_items(*)
    `)
    .eq('is_recurring', true)
    .lte('next_invoice_date', today.toISOString());

  if (fetchError) {
    console.error('Error fetching recurring invoices:', fetchError);
    return;
  }

  for (const invoice of (recurringInvoices as RecurringInvoice[])) {
    try {
      // Create new invoice
      const newInvoice = {
        user_id: invoice.user_id,
        client_id: invoice.client_id,
        invoice_number: generateNextInvoiceNumber(invoice.invoice_number),
        status: 'draft',
        issue_date: today.toISOString(),
        due_date: calculateNextInvoiceDate(today, invoice.frequency || 'monthly').toISOString(),
        subtotal: invoice.subtotal,
        tax_rate: invoice.tax_rate,
        tax_amount: invoice.tax_amount,
        total: invoice.total,
        notes: invoice.notes,
        is_recurring: true,
        frequency: invoice.frequency,
        next_invoice_date: calculateNextInvoiceDate(today, invoice.frequency || 'monthly').toISOString()
      };

      const { data: createdInvoice, error: createError } = await supabaseAdmin
        .from('invoices')
        .insert(newInvoice)
        .select()
        .single();

      if (createError) throw createError;

      let newItems: Array<{
        invoice_id: string;
        item_id: string | null;
        description: string;
        quantity: number;
        price: number;
        total: number;
      }> = [];

      // Copy invoice items
      if (invoice.items && invoice.items.length > 0) {
        newItems = invoice.items.map(item => ({
          invoice_id: createdInvoice.id,
          item_id: item.item_id,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }));

        const { error: itemsError } = await supabaseAdmin
          .from('invoice_items')
          .insert(newItems);

        if (itemsError) throw itemsError;
      }

      // Update original invoice's next date
      const { error: updateError } = await supabaseAdmin
        .from('invoices')
        .update({ next_invoice_date: newInvoice.next_invoice_date })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      // Generate PDF and send email
      if (invoice.client) {
        // Fetch latest user profile info
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', invoice.user_id)
          .single();

        if (userError) throw userError;

        const companyInfo = userData ? {
          name: userData.company || userData.name,
          email: userData.email,
          address: userData.address || '',
          phone: userData.phone || ''
        } : {
          name: 'Your Company',
          email: '',
          address: '',
          phone: ''
        };

        // Convert Supabase client to expected Client type
        const client: Client = {
          id: parseInt(invoice.client.id),
          userId: parseInt(invoice.client.user_id),
          name: invoice.client.name,
          email: invoice.client.email,
          phone: invoice.client.phone,
          company: invoice.client.company,
          address: invoice.client.address,
          notes: invoice.client.notes,
          createdAt: new Date(invoice.client.created_at)
        };

        const pdfBuffer = await generateInvoicePdf({
          invoice: {
            ...createdInvoice,
            id: parseInt(createdInvoice.id),
            userId: parseInt(createdInvoice.user_id),
            clientId: parseInt(createdInvoice.client_id),
            issueDate: new Date(createdInvoice.issue_date),
            dueDate: new Date(createdInvoice.due_date),
            createdAt: new Date(createdInvoice.created_at),
            updatedAt: new Date(createdInvoice.updated_at)
          },
          items: newItems.map(item => ({
            id: 0, // This will be set by the database
            invoiceId: parseInt(createdInvoice.id),
            itemId: item.item_id ? parseInt(item.item_id) : null,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            createdAt: new Date()
          })),
          client,
          company: companyInfo
        });

        await sendInvoiceEmail({
          ...createdInvoice,
          id: parseInt(createdInvoice.id),
          userId: parseInt(createdInvoice.user_id),
          clientId: parseInt(createdInvoice.client_id),
          issueDate: new Date(createdInvoice.issue_date),
          dueDate: new Date(createdInvoice.due_date),
          createdAt: new Date(createdInvoice.created_at),
          updatedAt: new Date(createdInvoice.updated_at)
        }, client, pdfBuffer);
      }
    } catch (error) {
      console.error(`Error processing recurring invoice ${invoice.invoice_number}:`, error);
    }
  }
} 