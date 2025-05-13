import { Invoice, InsertInvoice } from '@shared/schema';
import { storage } from '../storage';
import { generateInvoicePdf } from './pdf';
import { sendInvoiceEmail } from './email';

interface RecurringSchedule {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'biweekly' | 'annually';
  startDate: Date;
  endDate?: Date;
  lastGenerated?: Date;
}

export async function createRecurringInvoice(
  baseInvoice: InsertInvoice,
  schedule: RecurringSchedule
): Promise<Invoice> {
  const invoice = await storage.createInvoice({
    ...baseInvoice,
    isRecurring: true,
    frequency: schedule.frequency,
    nextInvoiceDate: calculateNextInvoiceDate(schedule),
  });

  return invoice;
}

export async function processRecurringInvoices(): Promise<void> {
  const today = new Date();
  const invoices = await storage.getInvoices();
  
  for (const invoice of invoices) {
    if (!invoice.isRecurring || !invoice.nextInvoiceDate) continue;
    
    const nextDate = new Date(invoice.nextInvoiceDate);
    if (nextDate <= today) {
      // Generate new invoice
      const { id, ...invoiceData } = invoice;
      const newInvoice = await storage.createInvoice({
        ...invoiceData,
        invoiceNumber: generateNextInvoiceNumber(invoice.invoiceNumber),
        issueDate: new Date(),
        dueDate: calculateDueDate(new Date(), invoice.frequency || 'monthly'),
        nextInvoiceDate: calculateNextInvoiceDate({
          frequency: invoice.frequency || 'monthly',
          startDate: new Date(),
        }),
      });

      // Update original invoice's next date
      await storage.updateInvoice(invoice.id, {
        nextInvoiceDate: newInvoice.nextInvoiceDate,
      });

      // Generate PDF and send email
      const client = await storage.getClient(newInvoice.clientId);
      if (client) {
        const items = await storage.getInvoiceItemsByInvoiceId(newInvoice.id);
        const pdfBuffer = await generateInvoicePdf(newInvoice, client, items);
        await sendInvoiceEmail(newInvoice, client, pdfBuffer);
      }
    }
  }
}

function calculateNextInvoiceDate(schedule: RecurringSchedule): Date {
  const date = new Date(schedule.lastGenerated || schedule.startDate);
  
  switch (schedule.frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'annually':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

function calculateDueDate(issueDate: Date, frequency: string): Date {
  const date = new Date(issueDate);
  
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'annually':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1); // Default to monthly
  }

  return date;
}

function generateNextInvoiceNumber(currentNumber: string): string {
  const match = currentNumber.match(/(\d+)$/);
  if (!match) return `${currentNumber}-1`;
  
  const number = parseInt(match[1], 10);
  return currentNumber.replace(/\d+$/, (number + 1).toString());
} 