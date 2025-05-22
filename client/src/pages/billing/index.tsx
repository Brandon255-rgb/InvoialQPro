import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Check, AlertCircle, ArrowRight, Receipt } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type Subscription = {
  id: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  plan: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  amount: number;
  currency: string;
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "failed" | "pending";
  created: string;
  receipt_url?: string;
};

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Fetch subscription and payment history
  React.useEffect(() => {
    const fetchBillingData = async () => {
      try {
        // Fetch subscription
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user?.id)
          .single();

        if (subError && subError.code !== "PGRST116") throw subError;
        setSubscription(subData);

        // Fetch payment history
        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", user?.id)
          .order("created", { ascending: false });

        if (paymentError) throw paymentError;
        setPayments(paymentData || []);
      } catch (error) {
        console.error("Error fetching billing data:", error);
        toast({
          title: "Error",
          description: "Failed to load billing information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingData();
  }, [user?.id, toast]);

  const handleCancelSubscription = async () => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("subscriptions")
        .update({ cancel_at_period_end: true })
        .eq("id", subscription?.id);

      if (error) throw error;

      setSubscription(prev => prev ? { ...prev, cancel_at_period_end: true } : null);
      setIsCancelDialogOpen(false);

      toast({
        title: "Subscription canceled",
        description: "Your subscription will end at the current billing period",
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("subscriptions")
        .update({ cancel_at_period_end: false })
        .eq("id", subscription?.id);

      if (error) throw error;

      setSubscription(prev => prev ? { ...prev, cancel_at_period_end: false } : null);

      toast({
        title: "Subscription resumed",
        description: "Your subscription will continue after the current billing period",
      });
    } catch (error) {
      console.error("Error resuming subscription:", error);
      toast({
        title: "Error",
        description: "Failed to resume subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      case "trialing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case "succeeded":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your subscription and view payment history
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your active subscription details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Plan</p>
                      <p className="text-lg font-semibold">{subscription.plan}</p>
                    </div>
                    <Badge className={getStatusBadgeColor(subscription.status)}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Amount</p>
                    <p className="text-lg font-semibold">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: subscription.currency,
                      }).format(subscription.amount / 100)}
                      <span className="text-sm font-normal text-gray-500">/month</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {subscription.cancel_at_period_end
                        ? "Subscription ends"
                        : "Next billing date"}
                    </p>
                    <p className="text-lg font-semibold">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>

                  {subscription.cancel_at_period_end && (
                    <div className="rounded-lg bg-yellow-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-yellow-800">
                            Your subscription will end on{" "}
                            {new Date(subscription.current_period_end).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No active subscription</p>
                  <Button className="mt-4 bg-orange-600 hover:bg-orange-700">
                    Choose a Plan
                  </Button>
                </div>
              )}
            </CardContent>
            {subscription && (
              <CardFooter className="flex justify-between">
                {subscription.cancel_at_period_end ? (
                  <Button
                    onClick={handleResumeSubscription}
                    disabled={isUpdating}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Resume Subscription"
                    )}
                  </Button>
                ) : (
                  <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-red-600 hover:text-red-700">
                        Cancel Subscription
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Subscription</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel your subscription? You'll continue to have access until{" "}
                          {new Date(subscription.current_period_end).toLocaleDateString()}.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsCancelDialogOpen(false)}
                        >
                          Keep Subscription
                        </Button>
                        <Button
                          onClick={handleCancelSubscription}
                          disabled={isUpdating}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Canceling...
                            </>
                          ) : (
                            "Yes, Cancel Subscription"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                <Button variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Update Payment Method
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Your recent payments and invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.created).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: payment.currency,
                          }).format(payment.amount / 100)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusBadgeColor(payment.status)}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.receipt_url && (
                            <a
                              href={payment.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Receipt className="h-4 w-4 inline" />
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No payment history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 