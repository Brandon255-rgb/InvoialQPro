import { supabaseAdmin } from '../lib/supabase';
import { stripe } from './stripe';
import { createAuditLog } from './audit';

// Create payment intent
export async function createPaymentIntent(
  invoiceId: string,
  amount: number,
  currency: string = 'usd'
) {
  // Get invoice details
  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from('invoices')
    .select(`
      *,
      client:clients (
        id,
        name,
        email
      ),
      user:users (
        id,
        email,
        name
      )
    `)
    .eq('id', invoiceId)
    .single();

  if (invoiceError) throw invoiceError;
  if (!invoice) throw new Error('Invoice not found');

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    metadata: {
      invoiceId,
      userId: invoice.user_id,
      clientId: invoice.client_id
    },
    customer_email: invoice.client.email,
    description: `Payment for invoice ${invoice.invoice_number}`,
    receipt_email: invoice.client.email
  });

  // Create audit log
  await createAuditLog({
    userId: invoice.user_id,
    action: 'create_payment_intent',
    entity: 'invoice',
    entityId: invoiceId,
    metadata: {
      paymentIntentId: paymentIntent.id,
      amount,
      currency
    }
  });

  return paymentIntent;
}

// Get payment intent
export async function getPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}

// Cancel payment intent
export async function cancelPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

  // Get invoice ID from metadata
  const invoiceId = paymentIntent.metadata.invoiceId;
  if (invoiceId) {
    // Create audit log
    await createAuditLog({
      userId: paymentIntent.metadata.userId,
      action: 'cancel_payment_intent',
      entity: 'invoice',
      entityId: invoiceId,
      metadata: {
        paymentIntentId,
        status: paymentIntent.status
      }
    });
  }

  return paymentIntent;
}

// Get payment methods
export async function getPaymentMethods(customerId: string) {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card'
  });
  return paymentMethods;
}

// Attach payment method
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
) {
  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId
  });
  return paymentMethod;
}

// Detach payment method
export async function detachPaymentMethod(paymentMethodId: string) {
  const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
  return paymentMethod;
}

// Get payment history
export async function getPaymentHistory(invoiceId: string) {
  const { data: payments, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return payments;
}

// Get payment details
export async function getPaymentDetails(paymentId: string) {
  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .select(`
      *,
      invoice:invoices (
        id,
        invoice_number,
        status,
        total
      )
    `)
    .eq('id', paymentId)
    .single();

  if (error) throw error;
  return payment;
} 