import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Package, ShoppingCart } from "lucide-react";
import ItemForm from "@/components/items/ItemForm";

const ItemDetail = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/items/:id");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const userId = user?.id;
  const itemId = params?.id ? parseInt(params.id) : null;

  // Fetch item details
  const { data: item, isLoading: isItemLoading } = useQuery({
    queryKey: [`/api/items/${itemId}`],
    enabled: !!itemId,
  });

  // Fetch invoices to find where this item is used
  const { data: invoices = [] } = useQuery({
    queryKey: [`/api/invoices?userId=${userId}`],
    enabled: !!userId,
  });

  // Update item mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/items/${itemId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/items/${itemId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/items?userId=${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/dashboard?userId=${userId}`] });
      
      toast({
        title: "Item updated",
        description: "The item has been successfully updated",
      });
      
      setIsEditMode(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    },
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/items?userId=${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/dashboard?userId=${userId}`] });
      
      toast({
        title: "Item deleted",
        description: "The item has been successfully deleted",
      });
      
      navigate("/items");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete item. It may be used in invoices.",
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

  // Find invoices where this item is used
  const getItemInvoices = () => {
    const itemInvoices: any[] = [];
    
    invoices.forEach((invoice: any) => {
      if (invoice.items && invoice.items.some((invItem: any) => invItem.itemId === itemId)) {
        itemInvoices.push(invoice);
      }
    });
    
    return itemInvoices;
  };

  const itemInvoices = getItemInvoices();

  if (isItemLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <p className="text-red-700">This item may have been deleted or you don't have permission to view it.</p>
        <Link href="/items">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Items
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Item detail content, forms, dialogs, etc. */}
      {isEditMode ? (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <ItemForm
            onSubmit={handleSubmit}
            defaultValues={item}
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
          {/* Item Details Card */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                  <div className={`flex items-center justify-center h-16 w-16 rounded-md ${
                    item.isInventory ? 'bg-primary-100' : 'bg-accent-100'
                  }`}>
                    {item.isInventory ? (
                      <Package className={`h-8 w-8 text-primary-600`} />
                    ) : (
                      <ShoppingCart className={`h-8 w-8 text-accent-600`} />
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <h2 className="text-2xl font-semibold text-gray-900 mr-2">{item.name}</h2>
                    {item.category && (
                      <Badge variant="outline">{item.category}</Badge>
                    )}
                    <Badge className={item.isInventory ? 'bg-primary-100 text-primary-800' : 'bg-accent-100 text-accent-800'}>
                      {item.isInventory ? 'Physical Item' : 'Service'}
                    </Badge>
                  </div>
                  
                  <div className="mt-2 text-xl font-semibold text-primary-600">
                    {formatCurrency(item.price)}
                  </div>
                  
                  {item.description && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">Description</h3>
                      <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
                    </div>
                  )}
                  
                  {item.isInventory && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">Inventory</h3>
                      <div className="flex items-center">
                        <span className="text-lg font-medium">{item.stockQuantity} units in stock</span>
                        {item.stockQuantity !== undefined && item.stockQuantity <= 5 && (
                          <Badge variant="outline" className="ml-2 bg-danger-100 text-danger border-danger">
                            Low Stock
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">Created</h3>
                    <p className="text-gray-700">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Item Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Used In Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{itemInvoices.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {item.isInventory ? 'Total Value' : 'Total Billed'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {item.isInventory 
                    ? formatCurrency((item.stockQuantity || 0) * item.price)
                    : formatCurrency(itemInvoices.reduce((sum, invoice) => {
                        const invoiceItems = invoice.items || [];
                        const thisItem = invoiceItems.find((i: any) => i.itemId === itemId);
                        return sum + (thisItem ? thisItem.total : 0);
                      }, 0))
                  }
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {item.isInventory ? 'Stock Status' : 'Type'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {item.isInventory ? (
                  <>
                    <div className="text-2xl font-bold">
                      {item.stockQuantity === 0 
                        ? 'Out of Stock' 
                        : item.stockQuantity && item.stockQuantity <= 5 
                        ? 'Low Stock' 
                        : 'In Stock'}
                    </div>
                    <div className="mt-2 h-2 w-full bg-gray-200 rounded-full">
                      <div
                        className={`h-2 rounded-full ${
                          item.stockQuantity === 0 
                            ? 'bg-danger' 
                            : item.stockQuantity && item.stockQuantity <= 5 
                            ? 'bg-warning-500' 
                            : 'bg-success-500'
                        }`}
                        style={{ width: item.stockQuantity === 0 ? '3%' : `${Math.min((item.stockQuantity || 0) * 5, 100)}%` }}
                      ></div>
                    </div>
                  </>
                ) : (
                  <div className="text-2xl font-bold">Service</div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Invoices using this item */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
            </div>
            
            <div className="p-6">
              {itemInvoices.length > 0 ? (
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
                          Client
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">View</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {itemInvoices.slice(0, 5).map((invoice: any) => {
                        const invoiceItems = invoice.items || [];
                        const thisItem = invoiceItems.find((i: any) => i.itemId === itemId);
                        return (
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
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {invoice.client?.name || "Client"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{thisItem?.quantity || 0}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatCurrency(thisItem?.total || 0)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link href={`/invoices/${invoice.id}`}>
                                <Button variant="ghost" size="sm">View</Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">This item hasn't been used in any invoices yet</p>
                  <Link href="/invoices/create">
                    <Button>Create Invoice with this Item</Button>
                  </Link>
                </div>
              )}
              
              {itemInvoices.length > 5 && (
                <div className="mt-4 text-center">
                  <Button variant="outline">View All Invoices</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              item and it will no longer be available for new invoices.
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
    </>
  );
};

export default ItemDetail;
