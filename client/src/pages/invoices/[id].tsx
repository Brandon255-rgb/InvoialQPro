import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import DashboardLayout from "../components/layouts/Dashboard";
import InvoiceForm from "../components/invoices/InvoiceForm";
import { Button } from "../ui/button";
import { ArrowLeft, Edit, Download, Send, Printer } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "../lib/queryClient";
import { formatCurrency, formatDate, getStatusColor } from "../lib/utils";
import { downloadInvoicePdf, sendInvoiceEmail } from "../lib/email";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Avatar } from "../ui/avatar";

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
      <DashboardLayout title="Invoice Details" description="Loading invoice...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout title="Invoice Not Found" description="The requested invoice could not be found">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">This invoice may have been deleted or you don't have permission to view it.</p>
          <Link href="/invoices">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </Link>
        </div>
      </DashboardLayout>
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
    <DashboardLayout
      title={isEditMode ? "Edit Invoice" : `Invoice #${invoice.invoiceNumber}`}
      description={isEditMode ? "Make changes to this invoice" : `Issued on ${formatDate(invoice.issueDate)}`}
      actions={actions}
    >
      {isEditMode ? (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <InvoiceForm
            onSubmit={handleSubmit}
            defaultValues={{
              invoice: formattedInvoice,
              items: invoice.items || [],
            }}
            isSubmitting={updateMutation.isPending}
          />
          
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsEditMode(false)}
              className="mr-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Invoice Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  #{invoice.invoiceNumber}
                </h2>
                <div className="mt-1 flex items-center">
                  <Badge 
                    className={`${getStatusColor(invoice.status).bg} ${getStatusColor(invoice.status).text}`}
                  >
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                  {invoice.isRecurring && (
                    <Badge variant="outline" className="ml-2">
                      Recurring
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 text-right">
                <div className="text-gray-700">
                  <span className="font-medium">Issue Date:</span> {formatDate(invoice.issueDate)}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Due Date:</span> {formatDate(invoice.dueDate)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Client and Company Info */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Bill To
                </h3>
                {client && (
                  <div className="flex items-start">
                    <Avatar name={client.name} size="md" />
                    <div className="ml-3">
                      <div className="font-semibold text-gray-900">{client.name}</div>
                      {client.company && (
                        <div className="text-gray-600">{client.company}</div>
                      )}
                      <div className="text-gray-600">{client.email}</div>
                      {client.phone && (
                        <div className="text-gray-600">{client.phone}</div>
                      )}
                      {client.address && (
                        <div className="text-gray-600 whitespace-pre-line mt-1">
                          {client.address}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  From
                </h3>
                <div className="font-semibold text-gray-900">{user?.company || user?.name}</div>
                <div className="text-gray-600">{user?.email}</div>
                {user?.phone && (
                  <div className="text-gray-600">{user.phone}</div>
                )}
                {user?.address && (
                  <div className="text-gray-600 whitespace-pre-line mt-1">
                    {user.address}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Invoice Items */}
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items && invoice.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Invoice Summary */}
            <div className="mt-8 flex justify-end">
              <div className="w-full md:w-1/3">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between py-2 text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  
                  {invoice.tax > 0 && (
                    <div className="flex justify-between py-2 text-gray-600 border-t border-gray-200">
                      <span>Tax</span>
                      <span>{formatCurrency(invoice.tax)}</span>
                    </div>
                  )}
                  
                  {invoice.discount > 0 && (
                    <div className="flex justify-between py-2 text-gray-600 border-t border-gray-200">
                      <span>Discount</span>
                      <span>-{formatCurrency(invoice.discount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-2 text-gray-900 font-medium border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Notes
                </h3>
                <div className="bg-gray-50 p-4 rounded-md text-gray-700 whitespace-pre-line">
                  {invoice.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Send Invoice Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
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
              onClick={() => setIsSendDialogOpen(false)}
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

export default InvoiceDetail;
