import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/Dashboard";
import ItemForm from "@/components/items/ItemForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

const CreateItem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const userId = user?.id;

  // Create item mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/items", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/items?userId=${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/dashboard?userId=${userId}`] });
      
      toast({
        title: "Item created",
        description: "The item has been successfully added",
      });
      
      navigate(`/items/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create item",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      userId: userId,
    });
  };

  // Action buttons for the layout
  const actions = (
    <Link href="/items">
      <Button variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Items
      </Button>
    </Link>
  );

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <ItemForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
      <div className="mt-4">{actions}</div>
    </div>
  );
};

export default CreateItem;
