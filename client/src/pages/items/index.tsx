import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
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
import ItemsList from "@/components/items/ItemsList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Items = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // UI state
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Fetch items data
  const { data: items = [], isLoading } = useQuery({
    queryKey: [`/api/items?userId=${userId}`],
    enabled: !!userId,
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("DELETE", `/api/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/items?userId=${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/dashboard?userId=${userId}`] });
      
      toast({
        title: "Item deleted",
        description: "The item has been successfully deleted",
      });
      
      setItemToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete item. It may be used in invoices.",
        variant: "destructive",
      });
    },
  });

  // Handle item deletion
  const handleDeleteItem = (id: number) => {
    setItemToDelete(id);
  };

  // Action buttons for the layout
  const actions = (
    <Link href="/items/create">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </Link>
  );

  return (
    <>
      <ItemsList items={items} isLoading={isLoading} onDelete={handleDeleteItem} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
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
              onClick={() => itemToDelete && deleteMutation.mutate(itemToDelete)}
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

export default Items;
