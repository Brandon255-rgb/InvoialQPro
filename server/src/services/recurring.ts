import { Invoice, InsertInvoice, invoiceFrequencyEnum, users } from '@shared/schema';
import { db } from '../db';
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
  
  // Get all recurring invoices that are due for generation
  const recurringInvoices = await db.query.invoices.findMany({
    where: (invoices, { and, eq, lte }) => and(
      eq(invoices.isRecurring, true),
      lte(invoices.nextInvoiceDate, today)
    ),
    with: {
      client: true,
      items: true
    }
  });

  for (const invoice of recurringInvoices) {
    try {
      // Create new invoice
      const newInvoice: InsertInvoice = {
        userId: invoice.userId,
        clientId: invoice.clientId,
        invoiceNumber: generateNextInvoiceNumber(invoice.invoiceNumber),
        status: 'draft',
        issueDate: today,
        dueDate: calculateNextInvoiceDate(today, invoice.frequency || 'monthly'),
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount,
        total: invoice.total,
        notes: invoice.notes,
        isRecurring: true,
        frequency: invoice.frequency,
        nextInvoiceDate: calculateNextInvoiceDate(today, invoice.frequency || 'monthly')
      };

      const createdInvoice = await db.insert(invoices).values(newInvoice).returning();

      // Copy invoice items
      if (invoice.items && invoice.items.length > 0) {
        const newItems = invoice.items.map(item => ({
          invoiceId: createdInvoice[0].id,
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }));

        await db.insert(invoiceItems).values(newItems);
      }

      // Update original invoice's next date
      await db.update(invoices)
        .set({ nextInvoiceDate: newInvoice.nextInvoiceDate })
        .where(eq(invoices.id, invoice.id));

      // Generate PDF and send email
      if (invoice.client) {
        // Fetch latest user profile info
        const [invoiceUser] = await db.query.users.findMany({ where: (users, { eq }) => eq(users.id, invoice.userId) });
        const companyInfo = invoiceUser ? {
          name: invoiceUser.company || invoiceUser.name,
          email: invoiceUser.email,
          address: invoiceUser.address || '',
          phone: invoiceUser.phone || ''
        } : {
          name: 'Your Company',
          email: '',
          address: '',
          phone: ''
        };
        const pdfBuffer = await generateInvoicePdf({
          invoice: createdInvoice[0],
          items: newItems,
          client: invoice.client,
          company: companyInfo
        });
        await sendInvoiceEmail(createdInvoice[0], invoice.client, pdfBuffer);
      }
    } catch (error) {
      console.error(`Error processing recurring invoice ${invoice.invoiceNumber}:`, error);
    }
  }
} 