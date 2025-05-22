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
import ClientsList from "@/components/clients/ClientsList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Clients = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // UI state
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);

  // Fetch clients data
  const { data: clients = [], isLoading } = useQuery({
    queryKey: [`/api/clients?userId=${userId}`],
    enabled: !!userId,
  });

  // Delete client mutation
  const deleteMutation = useMutation({
    mutationFn: async (clientId: number) => {
      await apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients?userId=${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/dashboard?userId=${userId}`] });
      
      toast({
        title: "Client deleted",
        description: "The client has been successfully deleted",
      });
      
      setClientToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client. They may have associated invoices.",
        variant: "destructive",
      });
    },
  });

  // Handle client deletion
  const handleDeleteClient = (id: number) => {
    setClientToDelete(id);
  };

  // Action buttons for the layout
  const actions = (
    <Link href="/clients/create">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Add Client
      </Button>
    </Link>
  );

  return (
    <>
      <ClientsList clients={clients} isLoading={isLoading} onDelete={handleDeleteClient} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
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
              onClick={() => clientToDelete && deleteMutation.mutate(clientToDelete)}
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

export default Clients;
