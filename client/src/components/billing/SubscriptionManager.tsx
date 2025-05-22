import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService, SUBSCRIPTION_PLANS, type PaymentMethod } from '@/lib/payments';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, CreditCard, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function SubscriptionManager() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch current subscription
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('get-subscription');
      return data;
    },
  });

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => paymentService.getPaymentMethods(),
  });

  // Fetch billing history
  const { data: billingHistory = [], isLoading: isLoadingBillingHistory } = useQuery({
    queryKey: ['billing-history'],
    queryFn: () => paymentService.getBillingHistory(),
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ priceId, paymentMethodId }: { priceId: string; paymentMethodId: string }) => {
      return paymentService.createSubscription(priceId, paymentMethodId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['billing-history'] });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      return paymentService.cancelSubscription(subscriptionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['billing-history'] });
    },
  });

  const handleSubscribe = async (planId: string) => {
    try {
      setIsProcessing(true);
      setSelectedPlan(planId);

      // If no payment method exists, redirect to add payment method
      if (paymentMethods.length === 0) {
        // TODO: Implement Stripe Checkout or Elements for adding payment method
        return;
      }

      // Use the first payment method for now
      const paymentMethodId = paymentMethods[0].id;
      await createSubscriptionMutation.mutateAsync({ priceId: planId, paymentMethodId });
    } catch (error) {
      console.error('Error subscribing:', error);
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.id) return;
    try {
      setIsProcessing(true);
      await cancelSubscriptionMutation.mutateAsync(subscription.id);
    } catch (error) {
      console.error('Error canceling subscription:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingSubscription || isLoadingPaymentMethods || isLoadingBillingHistory) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your current subscription plan and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-primary-700">
                    {subscription.plan.name}
                  </h3>
                  <p className="text-sm text-primary-600">
                    {formatCurrency(subscription.plan.price)}/{subscription.plan.interval}
                  </p>
                </div>
                <Badge variant="outline" className="bg-primary-100 text-primary-800 border-primary-200">
                  Active
                </Badge>
              </div>
              <div className="mt-3">
                <div className="h-1.5 w-full bg-primary-200 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-600 h-full rounded-full"
                    style={{ width: `${subscription.usage.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-primary-700">
                  <span>{subscription.usage.percentage}% used</span>
                  <span>{subscription.usage.daysLeft} days left</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            {paymentMethods.length > 0 && (
              <div className="p-4 flex justify-between items-center border rounded-lg">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="font-medium">
                      {paymentMethods[0].card.brand} ending in {paymentMethods[0].card.last4}
                    </p>
                    <p className="text-sm text-gray-500">
                      Expires {paymentMethods[0].card.expMonth}/{paymentMethods[0].card.expYear}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>
            )}

            {/* Billing History */}
            <div className="p-4">
              <p className="font-medium mb-2">Billing History</p>
              <div className="space-y-2">
                {billingHistory.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              {billingHistory.length > 3 && (
                <Button variant="link" size="sm" className="mt-2 px-0">
                  View all transactions
                </Button>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="text-danger border-danger hover:bg-danger/10"
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Available Plans */}
      {!subscription && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card key={plan.id} className="relative">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  {formatCurrency(plan.price)}/{plan.interval}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-primary-600 mr-2" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isProcessing && selectedPlan === plan.id}
                >
                  {isProcessing && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 