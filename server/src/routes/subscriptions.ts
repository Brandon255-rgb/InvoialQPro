import { Router, Request, Response } from "express";
import { auth } from "../middleware/auth";
import { db, schema } from "../lib/db";
import { stripe } from "../services/stripe";
import { eq } from "drizzle-orm";
import type { Stripe } from "stripe";

const router = Router();

router.get("/current", auth, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user.id;
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.userId, userId)
    });

    if (!subscription) {
      return res.json(null);
    }

    const now = new Date();
    if (!subscription.currentPeriodEnd || !subscription.currentPeriodStart) {
      return res.status(400).json({ error: "Invalid subscription dates" });
    }

    const endDate = new Date(subscription.currentPeriodEnd);
    const startDate = new Date(subscription.currentPeriodStart);
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const percentage = Math.max(0, Math.min(100, 
      (endDate.getTime() - now.getTime()) / 
      (endDate.getTime() - startDate.getTime()) * 100
    ));

    res.json({
      ...subscription,
      usage: {
        percentage: Math.round(percentage),
        daysLeft
      }
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

router.post("/", auth, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id || !req.user?.email) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { priceId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId)
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Create or get Stripe customer
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        name: user.name || undefined
      });
    }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription"
      },
      expand: ["latest_invoice.payment_intent"]
    });

    // Type assertion to access subscription properties
    const typedSubscription = subscription as unknown as {
      id: string;
      status: string;
      current_period_start: number;
      current_period_end: number;
      cancel_at_period_end: boolean;
    };

    await db.insert(schema.subscriptions).values({
      stripeSubscriptionId: typedSubscription.id,
      userId,
      status: typedSubscription.status,
      priceId: priceId,
      currentPeriodStart: new Date(typedSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(typedSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: typedSubscription.cancel_at_period_end
    });

    res.json(subscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

router.delete("/:id", auth, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const subscriptionId = req.params.id;
    const userId = req.user.id;

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.stripeSubscriptionId, subscriptionId)
    });

    if (!subscription || subscription.userId !== userId) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    await db.update(schema.subscriptions)
      .set({ cancelAtPeriodEnd: true })
      .where(eq(schema.subscriptions.stripeSubscriptionId, subscriptionId));

    res.json({ message: "Subscription will be canceled at the end of the billing period" });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// Get payment methods
router.get('/payment-methods', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user?.stripeCustomerId) {
      return res.json([]);
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    res.json(paymentMethods.data.map(method => ({
      id: method.id,
      type: method.type,
      card: {
        brand: method.card?.brand,
        last4: method.card?.last4,
        expMonth: method.card?.exp_month,
        expYear: method.card?.exp_year,
      },
    })));
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Add payment method
router.post('/payment-methods', auth, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const userId = req.user.id;

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    // Set as default if it's the first payment method
    const existingMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    if (existingMethods.data.length === 1) {
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    res.json({ message: 'Payment method added successfully' });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ error: 'Failed to add payment method' });
  }
});

// Update default payment method
router.put('/payment-methods/default', auth, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const userId = req.user.id;

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({ message: 'Default payment method updated' });
  } catch (error) {
    console.error('Error updating default payment method:', error);
    res.status(500).json({ error: 'Failed to update default payment method' });
  }
});

// Get billing history
router.get('/billing/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user?.stripeCustomerId) {
      return res.json([]);
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 10,
    });

    res.json(invoices.data.map(invoice => ({
      id: invoice.id,
      amount: invoice.amount_paid / 100, // Convert from cents
      status: invoice.status,
      date: new Date(invoice.created * 1000).toISOString(),
      description: invoice.description || `Invoice for ${new Date(invoice.period_start * 1000).toLocaleDateString()}`,
    })));
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({ error: 'Failed to fetch billing history' });
  }
});

export default router; 