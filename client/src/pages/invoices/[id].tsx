import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from "../../hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "../../lib/queryClient";
import { formatCurrency, formatDate, getStatusColor } from "../../lib/utils";
import { downloadInvoicePdf, sendInvoiceEmail } from "../../lib/email";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Avatar } from "../../components/ui/avatar";
import type { Invoice, Client } from "@shared/schema";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Edit, Download, Send, Printer } from "lucide-react";
import InvoiceForm from "../../components/invoices/InvoiceForm";

const InvoiceDetail = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/invoices/:id");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);
  
  const userId = user?.id;
  const invoiceId = params?.id ? parseInt(params.id) : null;

  // Fetch invoice details
  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });

  // Fetch client details if invoice is loaded
  const { data: client } = useQuery<Client>({
    queryKey: [`/api/clients/${invoice?.clientId}`],
    enabled: !!invoice?.clientId,
  });

  // Update invoice mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/invoices/${invoiceId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices?userId=${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/dashboard?userId=${userId}`] });
      
      toast({
        title: "Invoice updated",
        description: "The invoice has been successfully updated",
      });
      
      setIsEditMode(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update invoice",
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
    
    updateMutation.mutate(data);
  };

  const handleDownloadPdf = async () => {
    if (!invoiceId) return;
    
    try {
      await downloadInvoicePdf(invoiceId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download invoice PDF",
        variant: "destructive",
      });
    }
  };

  const handlePrintInvoice = async () => {
    if (!invoiceId) return;
    
    try {
      const pdfUrl = await downloadInvoicePdf(invoiceId, false);
      
      // Open PDF in new window and print
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to print invoice",
        variant: "destructive",
      });
    }
  };

  const handleSendInvoice = () => {
    if (!invoice || !client) return;
    
    setRecipientEmail(client.email || "");
    setIsSendDialogOpen(true);
  };

  const sendInvoice = async () => {
    if (!invoiceId || !recipientEmail) return;
    
    setIsEmailSending(true);
    
    try {
      await sendInvoiceEmail(invoiceId, recipientEmail);
      
      toast({
        title: "Invoice sent",
        description: `Invoice has been sent to ${recipientEmail}`,
      });
      
      // Refresh invoice data
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      
      // Close dialog
      setIsSendDialogOpen(false);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <p className="text-red-700">This invoice may have been deleted or you don't have permission to view it.</p>
        <Link href="/invoices">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  // Format invoice data for the form
  const formattedInvoice = {
    ...invoice,
    issueDate: new Date(invoice.issueDate),
    dueDate: new Date(invoice.dueDate),
    nextInvoiceDate: invoice.nextInvoiceDate ? new Date(invoice.nextInvoiceDate) : undefined,
  };

  // Action buttons for the layout
  const actions = (
    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
      <Link href="/invoices">
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </Link>
      
      {!isEditMode && (
        <>
          <Button variant="outline" onClick={handlePrintInvoice}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={handleSendInvoice}>
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
          <Button onClick={() => setIsEditMode(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Invoice
          </Button>
        </>
      )}
    </div>
  );

  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-4">Invoice #{invoice.invoiceNumber}</h1>
      {/* Invoice detail content, forms, dialogs, etc. */}
      {/* ...rest of invoice detail content... */}
    </>
  );
};

export default InvoiceDetail;
