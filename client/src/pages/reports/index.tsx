import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

const Reports = () => {
  const { user } = useAuth();
  const userId = user?.id;
  
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const years = [
    new Date().getFullYear().toString(),
    (new Date().getFullYear() - 1).toString(),
    (new Date().getFullYear() - 2).toString(),
  ];

  // Fetch dashboard data which contains some analytics
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [`/api/analytics/dashboard?userId=${userId}`],
    enabled: !!userId,
  });

  // Fetch all invoices
  const { data: invoices = [] } = useQuery({
    queryKey: [`/api/invoices?userId=${userId}`],
    enabled: !!userId,
  });

  // Fetch all clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: [`/api/clients?userId=${userId}`],
    enabled: !!userId,
    queryFn: () => apiRequest("GET", `/api/clients?userId=${userId}`).then((res: any) => res.json()),
  });

  // Calculate quarter data
  const calculateQuarterlyData = () => {
    const quarters = [
      { name: 'Q1', value: 0 },
      { name: 'Q2', value: 0 },
      { name: 'Q3', value: 0 },
      { name: 'Q4', value: 0 },
    ];
    
    if (!invoices || invoices.length === 0) return quarters;
    
    invoices.forEach((invoice: any) => {
      const issueDate = new Date(invoice.issueDate);
      const invoiceYear = issueDate.getFullYear().toString();
      
      if (invoiceYear === yearFilter && invoice.status === 'paid') {
        const month = issueDate.getMonth();
        const quarter = Math.floor(month / 3);
        
        quarters[quarter].value += invoice.total;
      }
    });
    
    return quarters;
  };

  // Calculate client data for pie chart
  const calculateClientData = () => {
    if (!clients || clients.length === 0 || !invoices || invoices.length === 0) {
      return [];
    }
    
    const clientRevenue: Record<number, { name: string; value: number }> = {};
    
    invoices.forEach((invoice: any) => {
      const issueDate = new Date(invoice.issueDate);
      const invoiceYear = issueDate.getFullYear().toString();
      
      if (invoiceYear === yearFilter && invoice.status === 'paid') {
        const clientId = invoice.clientId;
        
        if (!clientRevenue[clientId]) {
          const client = clients.find((c: any) => c.id === clientId);
          clientRevenue[clientId] = {
            name: client ? client.name : `Client #${clientId}`,
            value: 0
          };
        }
        
        clientRevenue[clientId].value += invoice.total;
      }
    });
    
    // Convert to array and take top 5
    return Object.values(clientRevenue)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  // Calculate invoice status data
  const calculateInvoiceStatusData = () => {
    if (!invoices || invoices.length === 0) return [];
    
    const statusCount: Record<string, number> = {
      paid: 0,
      sent: 0,
      overdue: 0,
      draft: 0,
      cancelled: 0
    };
    
    invoices.forEach((invoice: any) => {
      const issueDate = new Date(invoice.issueDate);
      const invoiceYear = issueDate.getFullYear().toString();
      
      if (invoiceYear === yearFilter) {
        statusCount[invoice.status] = (statusCount[invoice.status] || 0) + 1;
      }
    });
    
    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  };

  const quarterlyData = calculateQuarterlyData();
  const topClientsData = calculateClientData();
  const invoiceStatusData = calculateInvoiceStatusData();
  
  // Colors for pie charts
  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
  const STATUS_COLORS = {
    'Paid': '#10b981',
    'Sent': '#f59e0b',
    'Overdue': '#ef4444',
    'Draft': '#9ca3af',
    'Cancelled': '#6b7280'
  };

  // Action buttons for the layout
  const actions = (
    <Button variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Export Reports
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year Filter */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Reports & Analytics</h2>
          <p className="text-sm text-gray-500">Visualize your business performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Year:</span>
          <Select
            value={yearFilter}
            onValueChange={(value) => setYearFilter(value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Revenue Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="monthly">
            <TabsList className="mb-4">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            </TabsList>
            
            <TabsContent value="monthly" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dashboardData?.monthlyRevenue || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey={(entry) => {
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return months[entry.month - 1];
                    }} 
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value).replace('.00', '')} 
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    name="Revenue" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="quarterly" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={quarterlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value).replace('.00', '')} />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Revenue" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Invoice Stats and Client Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || "#9ca3af"} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} invoices`, 'Count']}
                    labelFormatter={(name) => `${name}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {invoiceStatusData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <span 
                    className="inline-block h-3 w-3 rounded-full mr-2"
                    style={{ backgroundColor: STATUS_COLORS[item.name as keyof typeof STATUS_COLORS] || "#9ca3af" }}
                  ></span>
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top Clients by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topClientsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.slice(0, 10)}${name.length > 10 ? '...' : ''} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topClientsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(name) => `${name}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              {topClientsData.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span 
                      className="inline-block h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dashboardData?.monthlyRevenue || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey={(entry) => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return months[entry.month - 1];
                  }} 
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value).replace('.00', '')} 
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Coming Soon Features */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics Coming Soon</h3>
        <p className="text-gray-600 mb-4">We're working on adding more powerful reporting features like export options, custom date ranges, and detailed client analytics.</p>
        <Button variant="outline">Request a Feature</Button>
      </div>
    </div>
  );
};

export default Reports;
