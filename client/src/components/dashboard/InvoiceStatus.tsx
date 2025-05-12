import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface InvoiceStatusItem {
  status: string;
  count: number;
}

interface InvoiceStatusProps {
  data: InvoiceStatusItem[];
}

const COLORS = {
  paid: "#10B981",   // success-500
  pending: "#F59E0B", // warning-500
  overdue: "#EF4444", // danger
  draft: "#9CA3AF",   // gray-400
  cancelled: "#6B7280" // gray-500
};

const LABELS = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
  draft: "Draft",
  cancelled: "Cancelled"
};

const InvoiceStatus: React.FC<InvoiceStatusProps> = ({ data }) => {
  // Transform the data for chart
  const chartData = data.map(item => ({
    name: LABELS[item.status as keyof typeof LABELS] || item.status,
    value: item.count,
    status: item.status
  }));
  
  // Calculate total
  const total = chartData.reduce((sum, item) => sum + item.count, 0);
  
  // Calculate percentages
  const dataWithPercentage = chartData.map(item => ({
    ...item,
    percentage: Math.round((item.value / total) * 100)
  }));
  
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    return (
      <text x={x} y={y} fill="#FFF" textAnchor="middle" dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-200">
          <p className="font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-primary-600">
            {payload[0].value} invoices ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Invoice Status</h3>
      </div>
      <div className="p-4 sm:p-6">
        <div className="relative h-48 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
              >
                {dataWithPercentage.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.status as keyof typeof COLORS] || "#9CA3AF"} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="block text-2xl font-bold text-gray-900">{total}</span>
              <span className="text-sm text-gray-500">Total Invoices</span>
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          {dataWithPercentage.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <span 
                  className={`h-3 w-3 rounded-full mr-2`}
                  style={{ backgroundColor: COLORS[item.status as keyof typeof COLORS] || "#9CA3AF" }}
                ></span>
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{item.value}</span>
                <span className="text-sm text-gray-500">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvoiceStatus;
