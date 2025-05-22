import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Filter, Download, Calendar } from "lucide-react";
import { format } from "date-fns";

type Activity = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  created_at: string;
  user: {
    email: string;
    name: string;
  };
};

const activityTypes = [
  { value: "all", label: "All Activities" },
  { value: "invoice", label: "Invoice" },
  { value: "client", label: "Client" },
  { value: "payment", label: "Payment" },
  { value: "user", label: "User" },
  { value: "system", label: "System" },
];

const actionIcons: Record<string, { icon: string; color: string }> = {
  create: { icon: "➕", color: "bg-green-100 text-green-800" },
  update: { icon: "✏️", color: "bg-blue-100 text-blue-800" },
  delete: { icon: "🗑️", color: "bg-red-100 text-red-800" },
  login: { icon: "🔑", color: "bg-purple-100 text-purple-800" },
  logout: { icon: "🚪", color: "bg-gray-100 text-gray-800" },
  payment: { icon: "💰", color: "bg-yellow-100 text-yellow-800" },
  export: { icon: "📤", color: "bg-indigo-100 text-indigo-800" },
  import: { icon: "📥", color: "bg-indigo-100 text-indigo-800" },
};

export default function ActivityLog() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchActivities();
  }, [selectedType, dateRange]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("activity_log")
        .select(`
          *,
          user:users(email, name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (selectedType !== "all") {
        query = query.eq("entity_type", selectedType);
      }

      if (dateRange.start) {
        query = query.gte("created_at", dateRange.start);
      }

      if (dateRange.end) {
        query = query.lte("created_at", dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast({
        title: "Error",
        description: "Failed to fetch activity log. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_log")
        .select(`
          *,
          user:users(email, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const csvContent = [
        ["Date", "User", "Action", "Entity Type", "Entity ID", "Details"],
        ...(data || []).map((activity) => [
          format(new Date(activity.created_at), "yyyy-MM-dd HH:mm:ss"),
          activity.user?.email || "System",
          activity.action,
          activity.entity_type,
          activity.entity_id,
          JSON.stringify(activity.details),
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Activity log has been exported to CSV.",
      });
    } catch (error) {
      console.error("Error exporting activities:", error);
      toast({
        title: "Error",
        description: "Failed to export activity log. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredActivities = activities.filter((activity) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      activity.action.toLowerCase().includes(searchLower) ||
      activity.entity_type.toLowerCase().includes(searchLower) ||
      activity.user?.email.toLowerCase().includes(searchLower) ||
      activity.user?.name?.toLowerCase().includes(searchLower) ||
      JSON.stringify(activity.details).toLowerCase().includes(searchLower)
    );
  });

  const getActionIcon = (action: string) => {
    const baseAction = action.split("_")[0].toLowerCase();
    return actionIcons[baseAction] || { icon: "📝", color: "bg-gray-100 text-gray-800" };
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track and monitor all activities in your account
            </p>
          </div>
          <Button
            onClick={handleExport}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search activities..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select
                value={selectedType}
                onValueChange={setSelectedType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="w-full"
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="w-full"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setDateRange({ start: "", end: "" });
                  setSelectedType("all");
                  setSearchQuery("");
                }}
                className="w-full"
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Showing the latest 100 activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity) => {
                      const { icon, color } = getActionIcon(activity.action);
                      return (
                        <TableRow key={activity.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(activity.created_at), "MMM d, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            {activity.user ? (
                              <div>
                                <div className="font-medium">{activity.user.name}</div>
                                <div className="text-sm text-gray-500">{activity.user.email}</div>
                              </div>
                            ) : (
                              "System"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={color}>
                              <span className="mr-1">{icon}</span>
                              {activity.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium capitalize">{activity.entity_type}</span>
                              <span className="text-sm text-gray-500">ID: {activity.entity_id}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                              {JSON.stringify(activity.details, null, 2)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredActivities.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No activities found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 