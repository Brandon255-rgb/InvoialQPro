import Stripe from 'stripe';
import { Invoice, invoices } from '@shared/schema';
import { db } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sendPaymentConfirmation } from './email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createPaymentIntent(invoice: Invoice) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(invoice.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        invoiceId: invoice.id.toString(),
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
}

export async function handleWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = parseInt(paymentIntent.metadata.invoiceId);
        
        // Update invoice status to paid
        await db.update(invoices)
          .set({ status: 'paid' })
          .where(eq(invoices.id, invoiceId));
        
        // Get invoice and client details for email
        const invoice = await db.query.invoices.findFirst({
          where: eq(invoices.id, invoiceId),
          with: {
            client: true
          }
        });

        if (invoice && invoice.client) {
          await sendPaymentConfirmation(invoice, invoice.client);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        const failedInvoiceId = parseInt(failedPaymentIntent.metadata.invoiceId);
        
        // Update invoice status to overdue if payment failed
        await db.update(invoices)
          .set({ status: 'overdue' })
          .where(eq(invoices.id, failedInvoiceId));
        
        // Get invoice and client details for notification
        const failedInvoice = await db.query.invoices.findFirst({
          where: eq(invoices.id, failedInvoiceId),
          with: {
            client: true
          }
        });

        if (failedInvoice && failedInvoice.client) {
          // TODO: Send payment failure notification
          console.log(`Payment failed for invoice ${failedInvoice.invoiceNumber}`);
        }
        break;
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw new Error('Failed to handle webhook');
  }
} 