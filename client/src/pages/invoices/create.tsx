import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/Dashboard";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

const CreateInvoice = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const userId = user?.id;

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices?userId=${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/dashboard?userId=${userId}`] });
      
      toast({
        title: "Invoice created",
        description: "The invoice has been successfully created",
      });
      
      navigate(`/invoices/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    // Ensure all dates are properly formatted
    if (data.invoice.issueDate instanceof Date) {
      data.invoice.issueDate = data.invoice.issueDate.toISOString();
    }
    
    if (data.invoice.dueDate instanceof Date) {
      data.invoice.dueDate = data.invoice.dueDate.toISOString();
    }
    
    if (data.invoice.nextInvoiceDate instanceof Date) {
      data.invoice.nextInvoiceDate = data.invoice.nextInvoiceDate.toISOString();
    }
    
    createMutation.mutate(data);
  };

  // Action buttons for the layout
  const actions = (
    <Link href="/invoices">
      <Button variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Invoices
      </Button>
    </Link>
  );

  return (
    <DashboardLayout
      title="Create Invoice"
      description="Create a new invoice for your client"
      actions={actions}
    >
      <div className="bg-white shadow-sm rounded-lg p-6">
        <InvoiceForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default CreateInvoice;
