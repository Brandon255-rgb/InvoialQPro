import cron from 'node-cron';
import { processRecurringInvoices } from '../services/recurring';

// Run every day at midnight
const CRON_SCHEDULE = '0 0 * * *';

export function startRecurringInvoiceCron(): void {
  cron.schedule(CRON_SCHEDULE, async () => {
    try {
      await processRecurringInvoices();
    } catch (error) {
      console.error('Error processing recurring invoices:', error);
    }
  });
} 