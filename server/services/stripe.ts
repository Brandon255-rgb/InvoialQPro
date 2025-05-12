import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51RNux08ZfsBCDI8fH8eb1EsszKUH1IOJNeg8kL3HS5mAyOkwfteWZ096mWyRyKE29fPj1NKawzNTb7ikeUK8Canc00VKfzeTBJ';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',
});

// Example function to create a customer
export async function createCustomer(email: string, name: string) {
  return await stripe.customers.create({
    email,
    name,
  });
}

// Example function to create a payment intent for one-time payment
export async function createPaymentIntent(amount: number, currency: string, customerId?: string) {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    payment_method_types: ['card'],
  });
}

// Example function to create a subscription
export async function createSubscription(customerId: string, priceId: string) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
}

export default stripe;
