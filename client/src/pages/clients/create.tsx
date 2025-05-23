import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import ClientForm from "@/components/clients/ClientForm";

const CreateClient = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const userId = user?.id;

  // Create client mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/clients", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients?userId=${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/dashboard?userId=${userId}`] });
      
      toast({
        title: "Client created",
        description: "The client has been successfully added",
      });
      
      navigate(`/clients/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      user_id: userId,
    });
  };

  // Action buttons for the layout
  const actions = (
    <Link href="/clients">
      <Button variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Clients
      </Button>
    </Link>
  );

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <ClientForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
      <div className="mt-4">{actions}</div>
    </div>
  );
};

export default CreateClient;
