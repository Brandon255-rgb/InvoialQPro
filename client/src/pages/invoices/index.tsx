import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/Dashboard";
import InvoicesList from "@/components/invoices/InvoicesList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { downloadInvoicePdf, sendInvoiceEmail } from "@/lib/email";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Invoices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const userId = user?.id;

  // UI state
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
  const [invoiceToSend, setInvoiceToSend] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);

  // Fetch invoices data
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: [`/api/invoices?userId=${userId}`],
    enabled: !!userId,
  });

  // Get full invoice data with client info
  const { data: clients = [] } = useQuery({
    queryKey: [`/api/clients?userId=${userId}`],
    enabled: !!userId,
  });

  // Process invoices to include client info
  const invoices = invoicesData
    ? invoicesData.map((invoice: any) => {
        const client = clients.find(
          (c: any) => c.id === invoice.clientId
        ) || { name: "Unknown Client" };
        return {
          ...invoice,
          client: {
            id: client.id,
            name: client.name,
            company: client.company,
          },
        };
      })
    : [];

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      await apiRequest("DELETE", `/api/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices?userId=${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/dashboard?userId=${userId}`] });
      toast({
        title: "Invoice deleted",
        description: "The invoice has been successfully deleted",
      });
      setInvoiceToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  // Duplicate invoice mutation
  const duplicateMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await apiRequest("GET", `/api/invoices/${invoiceId}`);
      const invoiceData = await response.json();
      
      // Create a new invoice based on the existing one
      const newInvoice = {
        invoice: {
          ...invoiceData,
          id: undefined,
          invoiceNumber: `${invoiceData.invoiceNumber}-COPY`,
          status: "draft",
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        },
        items: invoiceData.items.map((item: any) => ({
          ...item,
          id: undefined,
          invoiceId: undefined,
        })),
      };
      
      await apiRequest("POST", "/api/invoices", newInvoice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices?userId=${userId}`] });
      toast({
        title: "Invoice duplicated",
        description: "A copy of the invoice has been created",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to duplicate invoice",
        variant: "destructive",
      });
    },
  });

  // Handle invoice actions
  const handleDeleteInvoice = (id: number) => {
    setInvoiceToDelete(id);
  };

  const handleDuplicateInvoice = (id: number) => {
    duplicateMutation.mutate(id);
  };

  const handleSendInvoice = (id: number) => {
    const invoice = invoices.find((inv: any) => inv.id === id);
    if (invoice && invoice.client) {
      setRecipientEmail(invoice.client.email || "");
      setInvoiceToSend(id);
    } else {
      toast({
        title: "Error",
        description: "Could not find client email",
        variant: "destructive",
      });
    }
  };

  const sendInvoice = async () => {
    if (!invoiceToSend || !recipientEmail) return;
    
    setIsEmailSending(true);
    
    try {
      await sendInvoiceEmail(invoiceToSend, recipientEmail);
      
      toast({
        title: "Invoice sent",
        description: `Invoice has been sent to ${recipientEmail}`,
      });
      
      // Refresh invoice data
      queryClient.invalidateQueries({ queryKey: [`/api/invoices?userId=${userId}`] });
      
      // Close dialog
      setInvoiceToSend(null);
      setRecipientEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive",
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleDownloadPdf = async (id: number) => {
    try {
      await downloadInvoicePdf(id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download invoice PDF",
        variant: "destructive",
      });
    }
  };

  // Action buttons for the layout
  const actions = (
    <Link href="/invoices/create">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        New Invoice
      </Button>
    </Link>
  );

  return (
    <DashboardLayout
      title="Invoices"
      description="Manage and track all your invoices"
      actions={actions}
    >
      <InvoicesList
        invoices={invoices}
        isLoading={isLoading}
        onSendInvoice={handleSendInvoice}
        onDownloadPdf={handleDownloadPdf}
        onDeleteInvoice={handleDeleteInvoice}
        onDuplicateInvoice={handleDuplicateInvoice}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              invoice and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => invoiceToDelete && deleteMutation.mutate(invoiceToDelete)}
              className="bg-danger hover:bg-danger/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Invoice Dialog */}
      <Dialog open={!!invoiceToSend} onOpenChange={(open) => !open && setInvoiceToSend(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice</DialogTitle>
            <DialogDescription>
              Enter the email address to send this invoice to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="client@example.com"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInvoiceToSend(null)}
              disabled={isEmailSending}
            >
              Cancel
            </Button>
            <Button
              onClick={sendInvoice}
              disabled={!recipientEmail || isEmailSending}
            >
              {isEmailSending ? "Sending..." : "Send Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Invoices;
