import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from "../../hooks/use-toast";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "../../lib/queryClient";
import { formatDate } from "../../lib/utils";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

interface Client {
  id: number;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

interface Invoice {
  id: number;
  clientId: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  total: number;
  status: string;
}

const ClientDetail = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/clients/:id");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const userId = user?.id;
  const clientId = params?.id ? parseInt(params.id) : null;

  // Fetch client details
  const { data: client, isLoading: isClientLoading } = useQuery<Client>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });

  // Fetch client's invoices
  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery<Invoice[]>({
    queryKey: [`/api/invoices?userId=${userId}`],
    enabled: !!userId,
  });

  // Filter invoices for this client
  const clientInvoices = invoices.filter((invoice: Invoice) => invoice.clientId === clientId);

  // Update client mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/clients/${clientId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients?userId=${userId}`] });
      
      toast({
        title: "Client updated",
        description: "The client has been successfully updated",
      });
      
      setIsEditMode(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    },
  });

  // Delete client mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients?userId=${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/dashboard?userId=${userId}`] });
      
      toast({
        title: "Client deleted",
        description: "The client has been successfully deleted",
      });
      
      navigate("/clients");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client. They may have associated invoices.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    updateMutation.mutate({
      ...data,
      userId: userId,
    });
  };

  // Calculate client stats
  const calculateStats = () => {
    const totalInvoices = clientInvoices.length;
    const totalRevenue = clientInvoices.reduce((sum: number, invoice: Invoice) => sum + invoice.total, 0);
    const paidInvoices = clientInvoices.filter((invoice: Invoice) => invoice.status === 'paid').length;
    const pendingInvoices = clientInvoices.filter((invoice: Invoice) => invoice.status === 'sent').length;
    const overdueInvoices = clientInvoices.filter((invoice: Invoice) => invoice.status === 'overdue').length;
    
    return {
      totalInvoices,
      totalRevenue,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      paymentRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0
    };
  };

  const clientStats = calculateStats();

  if (isClientLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <p className="text-red-700">This client may have been deleted or you don't have permission to view it.</p>
        <Link href="/clients">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Client detail content, forms, dialogs, etc. */}
      {/* ...rest of client detail content... */}
    </>
  );
};

export default ClientDetail;
