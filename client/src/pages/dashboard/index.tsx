import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/Dashboard";
import StatsCard from "@/components/dashboard/StatsCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import InvoiceStatus from "@/components/dashboard/InvoiceStatus";
import RecentInvoices from "@/components/dashboard/RecentInvoices";
import UpcomingReminders from "@/components/dashboard/UpcomingReminders";
import TopClients from "@/components/dashboard/TopClients";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Download, 
  Plus,
  CircleAlert,
  TriangleAlert,
  X,
  CircleHelp,
  CloudAlert,
  PanelTopClose,
  PanelTopOpen,
  PanelTopDashed,
  OctagonAlert,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const reminderFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
});

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id;
  
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: [`/api/analytics/dashboard?userId=${userId}`],
    enabled: !!userId,
  });
  
  const form = useForm({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: new Date().toISOString().split('T')[0] + 'T12:00',
    },
  });
  
  const handleAddReminder = async (data: z.infer<typeof reminderFormSchema>) => {
    try {
      await apiRequest("POST", "/api/reminders", {
        userId,
        title: data.title,
        description: data.description || "",
        dueDate: new Date(data.dueDate),
        isCompleted: false,
      });
      
      toast({
        title: "Reminder added",
        description: "Your reminder has been created successfully",
      });
      
      // Close dialog and reset form
      setIsReminderDialogOpen(false);
      form.reset();
      
      // Refetch dashboard data
      refetch();
    } catch (error) {
      toast({
        title: "Failed to add reminder",
        description: "There was an error creating your reminder",
        variant: "destructive",
      });
    }
  };
  
  // Generate dashboard action buttons
  const DashboardActions = (
    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Export Data
      </Button>
      <Link href="/invoices/create">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </Link>
    </div>
  );
  
  if (isLoading) {
    return (
      <DashboardLayout 
        title="Dashboard" 
        description="Loading dashboard data..."
        actions={DashboardActions}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!dashboardData) {
    return (
      <DashboardLayout 
        title="Dashboard" 
        description="Failed to load dashboard data"
        actions={DashboardActions}
      >
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <CircleAlert className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>There was an error loading your dashboard data. Please try refreshing the page.</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  const { 
    stats, 
    monthlyRevenue, 
    invoiceStatusSummary, 
    topClients, 
    upcomingReminders, 
    recentInvoices 
  } = dashboardData;
  
  return (
    <DashboardLayout 
      title="Dashboard" 
      description="Overview of your business finances and activity"
      actions={DashboardActions}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Revenue"
          value={stats.totalRevenue}
          icon="fas fa-dollar-sign"
          iconBgColor="bg-primary-100"
          iconColor="text-primary-600"
          percentChange={8.2}
          currency={true}
          detailsLink="/reports/revenue"
        />
        
        <StatsCard
          title="Outstanding Invoices"
          value={stats.outstandingAmount}
          icon="fas fa-file-invoice"
          iconBgColor="bg-warning-100"
          iconColor="text-warning-600"
          percentChange={2.3}
          currency={true}
          detailsLink="/invoices?status=pending"
        />
        
        <StatsCard
          title="Active Clients"
          value={stats.activeClientsCount}
          icon="fas fa-users"
          iconBgColor="bg-success-100"
          iconColor="text-success-600"
          percentChange={12}
          detailsLink="/clients"
        />
        
        <StatsCard
          title="Items in Stock"
          value={stats.itemsInStockCount}
          icon="fas fa-box"
          iconBgColor="bg-accent-100"
          iconColor="text-accent-600"
          percentChange={-3}
          detailsLink="/items"
        />
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <RevenueChart data={monthlyRevenue} />
        <InvoiceStatus data={invoiceStatusSummary} />
      </div>
      
      {/* Recent Activity & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <RecentInvoices invoices={recentInvoices} />
        <UpcomingReminders 
          reminders={upcomingReminders} 
          onAddReminder={() => setIsReminderDialogOpen(true)} 
        />
      </div>
      
      {/* Top Clients Section */}
      {topClients && topClients.length > 0 && (
        <TopClients clients={topClients} />
      )}
      
      {/* Add Reminder Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Reminder</DialogTitle>
            <DialogDescription>
              Create a new reminder for tasks or follow-ups
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddReminder)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Reminder title..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add details about this reminder..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsReminderDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Reminder</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Dashboard;
