import cron from 'node-cron';
import { processRecurringInvoices } from '../services/recurring';

// Run every day at midnight
export function startRecurringInvoiceCron() {
  cron.schedule('0 0 * * *', async () => {
    try {
      await processRecurringInvoices();
    } catch (error) {
      console.error('Error processing recurring invoices:', error);
    }
  });
} 