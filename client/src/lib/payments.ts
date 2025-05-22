import { supabase } from './supabase';
import { useToast } from '@/hooks/use-toast';

// Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface BillingHistory {
  id: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'pending';
  date: string;
  description: string;
}

// Subscription Plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'pro-monthly',
    name: 'Pro Plan',
    price: 29,
    interval: 'month',
    features: [
      'Unlimited invoices',
      'Unlimited clients',
      'Recurring invoices',
      'Invoice templates',
      'Payment tracking',
      'Email notifications',
      'PDF exports',
    ],
  },
  {
    id: 'pro-yearly',
    name: 'Pro Plan',
    price: 290,
    interval: 'year',
    features: [
      'All monthly features',
      '2 months free',
      'Priority support',
      'Custom branding',
      'Advanced analytics',
    ],
  },
];

// Payment Service
export class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  private showToast(title: string, description: string, variant: 'default' | 'destructive' = 'default') {
    const { toast } = useToast();
    toast({
      title,
      description,
      variant,
    });
  }

  // Subscription Management
  async createSubscription(priceId: string, paymentMethodId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { priceId, paymentMethodId },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      this.showToast(
        'Subscription Error',
        'Failed to create subscription. Please try again.',
        'destructive'
      );
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      this.showToast(
        'Cancellation Error',
        'Failed to cancel subscription. Please try again.',
        'destructive'
      );
      throw error;
    }
  }

  async updatePaymentMethod(paymentMethodId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('update-payment-method', {
        body: { paymentMethodId },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating payment method:', error);
      this.showToast(
        'Payment Method Error',
        'Failed to update payment method. Please try again.',
        'destructive'
      );
      throw error;
    }
  }

  // Invoice Payments
  async createPaymentIntent(invoiceId: string, amount: number) {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { invoiceId, amount },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      this.showToast(
        'Payment Error',
        'Failed to process payment. Please try again.',
        'destructive'
      );
      throw error;
    }
  }

  async handleInvoicePayment(invoiceId: string, paymentMethodId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('handle-invoice-payment', {
        body: { invoiceId, paymentMethodId },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error handling invoice payment:', error);
      this.showToast(
        'Payment Error',
        'Failed to process invoice payment. Please try again.',
        'destructive'
      );
      throw error;
    }
  }

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-methods');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  async addPaymentMethod(paymentMethodId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('add-payment-method', {
        body: { paymentMethodId },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding payment method:', error);
      this.showToast(
        'Payment Method Error',
        'Failed to add payment method. Please try again.',
        'destructive'
      );
      throw error;
    }
  }

  // Billing History
  async getBillingHistory(): Promise<BillingHistory[]> {
    try {
      const { data, error } = await supabase.functions.invoke('get-billing-history');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching billing history:', error);
      throw error;
    }
  }

  // Recurring Invoices
  async setupRecurringInvoice(invoiceId: string, schedule: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
    startDate: Date;
    endDate?: Date;
  }) {
    try {
      const { data, error } = await supabase.functions.invoke('setup-recurring-invoice', {
        body: { invoiceId, schedule },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting up recurring invoice:', error);
      this.showToast(
        'Recurring Invoice Error',
        'Failed to set up recurring invoice. Please try again.',
        'destructive'
      );
      throw error;
    }
  }

  async cancelRecurringInvoice(invoiceId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('cancel-recurring-invoice', {
        body: { invoiceId },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error canceling recurring invoice:', error);
      this.showToast(
        'Recurring Invoice Error',
        'Failed to cancel recurring invoice. Please try again.',
        'destructive'
      );
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = PaymentService.getInstance(); 