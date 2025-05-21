import cron from 'node-cron';
import { processRecurringInvoices } from '../services/recurring';

// Run every day at midnight
const CRON_SCHEDULE = '0 0 * * *';

export function startRecurringInvoiceCron(): void {
  cron.schedule(CRON_SCHEDULE, async () => {
    try {
      console.log('Starting recurring invoice processing...');
      await processRecurringInvoices();
      console.log('Recurring invoice processing completed');
    } catch (error) {
      console.error('Error processing recurring invoices:', error);
    }
  });
} 