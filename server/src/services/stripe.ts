import Stripe from 'stripe';
import { Request } from 'express';
import { db } from '../db';
import { Invoice } from '@shared/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function handleStripeWebhook(req: Request): Promise<void> {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    throw new Error('No Stripe signature found');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
      break;
    case 'setup_intent.succeeded':
      await handleSetupIntentSuccess(event.data.object as Stripe.SetupIntent);
      break;
    case 'setup_intent.failed':
      await handleSetupIntentFailure(event.data.object as Stripe.SetupIntent);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const invoiceId = paymentIntent.metadata.invoiceId;
  if (!invoiceId) return;

  await db.update(Invoice)
    .set({ 
      status: 'paid',
      paidAt: new Date(),
      paymentMethod: 'stripe',
      paymentId: paymentIntent.id
    })
    .where(eq(Invoice.id, invoiceId));
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const invoiceId = paymentIntent.metadata.invoiceId;
  if (!invoiceId) return;

  await db.update(Invoice)
    .set({ 
      status: 'failed',
      paymentMethod: 'stripe',
      paymentId: paymentIntent.id
    })
    .where(eq(Invoice.id, invoiceId));
}

async function handleSetupIntentSuccess(setupIntent: Stripe.SetupIntent): Promise<void> {
  // Handle successful setup of payment method
  console.log('Setup intent succeeded:', setupIntent.id);
}

async function handleSetupIntentFailure(setupIntent: Stripe.SetupIntent): Promise<void> {
  // Handle failed setup of payment method
  console.log('Setup intent failed:', setupIntent.id);
} 