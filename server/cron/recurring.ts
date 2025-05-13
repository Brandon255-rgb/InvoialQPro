import cron from 'node-cron';
import { processRecurringInvoices } from '../services/recurring';

// Run every day at midnight
export function startRecurringInvoiceCron() {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Processing recurring invoices...');
      await processRecurringInvoices();
      console.log('Recurring invoices processed successfully');
    } catch (error) {
      console.error('Error processing recurring invoices:', error);
    }
  });
} 