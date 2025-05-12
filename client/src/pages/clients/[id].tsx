import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/Dashboard";
import ClientForm from "@/components/clients/ClientForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });

  // Fetch client's invoices
  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: [`/api/invoices?userId=${userId}`],
    enabled: !!userId,
  });

  // Filter invoices for this client
  const clientInvoices = invoices.filter((invoice: any) => invoice.clientId === clientId);

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
    const totalRevenue = clientInvoices.reduce((sum: number, invoice: any) => sum + invoice.total, 0);
    const paidInvoices = clientInvoices.filter((invoice: any) => invoice.status === 'paid').length;
    const pendingInvoices = clientInvoices.filter((invoice: any) => invoice.status === 'sent').length;
    const overdueInvoices = clientInvoices.filter((invoice: any) => invoice.status === 'overdue').length;
    
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

  // Action buttons for the layout
  const actions = (
    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
      <Link href="/clients">
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </Link>
      
      {!isEditMode && (
        <>
          <Button onClick={() => setIsEditMode(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Client
          </Button>
          <Button 
            variant="outline" 
            className="text-danger hover:bg-danger/10" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Client
          </Button>
        </>
      )}
    </div>
  );

  if (isClientLoading) {
    return (
      <DashboardLayout title="Client Details" description="Loading client information...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout title="Client Not Found" description="The requested client could not be found">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">This client may have been deleted or you don't have permission to view it.</p>
          <Link href="/clients">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={isEditMode ? "Edit Client" : client.name}
      description={isEditMode ? "Edit client information" : (client.company || "Client details")}
      actions={actions}
    >
      {isEditMode ? (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <ClientForm
            onSubmit={handleSubmit}
            defaultValues={client}
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
        <div className="space-y-6">
          {/* Client Profile Card */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                  <Avatar name={client.name} size="xl" />
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">{client.name}</h2>
                  {client.company && (
                    <p className="text-gray-600 text-lg mb-2">{client.company}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">Contact Information</h3>
                      <p className="text-gray-700">
                        <span className="font-medium">Email:</span> {client.email}
                      </p>
                      {client.phone && (
                        <p className="text-gray-700">
                          <span className="font-medium">Phone:</span> {client.phone}
                        </p>
                      )}
                    </div>
                    
                    {client.address && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">Address</h3>
                        <p className="text-gray-700 whitespace-pre-line">{client.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {client.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Notes</h3>
                  <p className="text-gray-700 whitespace-pre-line">{client.notes}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Client Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${clientStats.totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientStats.totalInvoices}</div>
                <p className="text-sm text-gray-500">
                  {clientStats.paidInvoices} paid, {clientStats.pendingInvoices} pending, {clientStats.overdueInvoices} overdue
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Payment Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientStats.paymentRate.toFixed(0)}%</div>
                <div className="h-2 w-full bg-gray-200 rounded-full mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      clientStats.paymentRate >= 80 
                        ? 'bg-success-500' 
                        : clientStats.paymentRate >= 60 
                        ? 'bg-success-400' 
                        : clientStats.paymentRate >= 40 
                        ? 'bg-warning-500'
                        : 'bg-danger'
                    }`}
                    style={{ width: `${clientStats.paymentRate}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Client Since</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDate(client.createdAt)}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs for Invoices and Activities */}
          <Tabs defaultValue="invoices" className="bg-white shadow-sm rounded-lg">
            <div className="px-6 pt-4 border-b">
              <TabsList>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="invoices" className="p-6">
              {isInvoicesLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : clientInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientInvoices.map((invoice: any) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-primary-600">
                              <Link href={`/invoices/${invoice.id}`}>
                                #{invoice.invoiceNumber}
                              </Link>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(invoice.issueDate)}</div>
                            <div className="text-xs text-gray-500">Due: {formatDate(invoice.dueDate)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">${invoice.total.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              invoice.status === 'paid'
                                ? 'bg-success-100 text-success-800'
                                : invoice.status === 'sent'
                                ? 'bg-warning-100 text-warning-800'
                                : invoice.status === 'overdue'
                                ? 'bg-danger-100 text-danger'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/invoices/${invoice.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No invoices found for this client</p>
                  <Link href="/invoices/create">
                    <Button>Create First Invoice</Button>
                  </Link>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="activities" className="p-6">
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">Client activity tracking is coming soon</p>
                <p className="text-sm text-gray-400">This feature will show all interactions with this client</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              client and may affect related invoices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-danger hover:bg-danger/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ClientDetail;
