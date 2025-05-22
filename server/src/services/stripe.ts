import Stripe from 'stripe';
import { Request } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const PAYMENT_INTENT_EVENTS = ['payment_intent.succeeded', 'payment_intent.payment_failed'] as const;
const SETUP_INTENT_EVENTS = ['setup_intent.succeeded', 'setup_intent.failed'] as const;

type PaymentIntentEventType = typeof PAYMENT_INTENT_EVENTS[number];
type SetupIntentEventType = typeof SETUP_INTENT_EVENTS[number];

function isPaymentIntentEventType(type: string): type is PaymentIntentEventType {
  return PAYMENT_INTENT_EVENTS.includes(type as PaymentIntentEventType);
}

function isSetupIntentEventType(type: string): type is SetupIntentEventType {
  return SETUP_INTENT_EVENTS.includes(type as SetupIntentEventType);
}

export async function handleStripeWebhook(req: Request): Promise<void> {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    throw new Error('No Stripe signature found');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    if (isPaymentIntentEventType(event.type)) {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (event.type === 'payment_intent.succeeded') {
        await handlePaymentSuccess(paymentIntent);
      } else {
        await handlePaymentFailure(paymentIntent);
      }
    } else if (isSetupIntentEventType(event.type)) {
      const setupIntent = event.data.object as Stripe.SetupIntent;
      if (event.type === 'setup_intent.succeeded') {
        await handleSetupIntentSuccess(setupIntent);
      } else {
        await handleSetupIntentFailure(setupIntent);
      }
    } else {
      console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(`Webhook Error: ${err.message}`);
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const invoiceId = paymentIntent.metadata?.invoiceId;
  if (!invoiceId) return;

  try {
    // Update invoice status in Supabase
    const { error } = await supabaseAdmin
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoiceId);

    if (error) throw error;

    // Create audit log
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        action: 'payment_received',
        entity: 'invoice',
        entity_id: invoiceId,
        user_id: paymentIntent.metadata?.userId
      });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const invoiceId = paymentIntent.metadata?.invoiceId;
  if (!invoiceId) return;

  try {
    // Update invoice status in Supabase
    const { error } = await supabaseAdmin
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('id', invoiceId);

    if (error) throw error;

    // Create audit log
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        action: 'payment_failed',
        entity: 'invoice',
        entity_id: invoiceId,
        user_id: paymentIntent.metadata?.userId
      });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
}

async function handleSetupIntentSuccess(setupIntent: Stripe.SetupIntent) {
  const userId = setupIntent.metadata?.userId;
  if (!userId) return;

  try {
    // Update user's payment method in Supabase
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        stripe_customer_id: setupIntent.customer as string,
        payment_method_id: setupIntent.payment_method as string
      })
      .eq('id', userId);

    if (error) throw error;

    // Create audit log
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        action: 'payment_method_added',
        entity: 'user',
        entity_id: userId,
        user_id: userId
      });
  } catch (error) {
    console.error('Error updating user payment method:', error);
    throw error;
  }
}

async function handleSetupIntentFailure(setupIntent: Stripe.SetupIntent) {
  const userId = setupIntent.metadata?.userId;
  if (!userId) return;

  try {
    // Create audit log for failed payment method setup
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        action: 'payment_method_failed',
        entity: 'user',
        entity_id: userId,
        user_id: userId
      });
  } catch (error) {
    console.error('Error logging payment method failure:', error);
    throw error;
  }
} 