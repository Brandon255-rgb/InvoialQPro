import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface MonthlyRevenueData {
  month: number;
  revenue: number;
}

interface RevenueChartProps {
  data: MonthlyRevenueData[];
}

const MonthlyLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const [activeView, setActiveView] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // Transform the data for display
  const chartData = data.map(item => ({
    name: MonthlyLabels[item.month - 1],
    value: item.revenue,
    month: item.month,
  }));

  // Find the current month for highlighting
  const currentMonth = new Date().getMonth() + 1;
  
  // Find max value for chart scaling
  const maxRevenue = Math.max(...data.map(item => item.revenue));

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-200">
          <p className="font-medium text-gray-900">{payload[0].payload.name}</p>
          <p className="text-primary-600">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // Get the maximum value for chart height
  const yAxisDomain = [0, Math.ceil(maxRevenue * 1.1)];

  return (
    <div className="bg-white shadow-sm rounded-lg lg:col-span-2">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Revenue Overview</h3>
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                activeView === 'monthly' 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setActiveView('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                activeView === 'quarterly' 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setActiveView('quarterly')}
            >
              Quarterly
            </button>
            <button 
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                activeView === 'yearly' 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setActiveView('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }} 
              />
              <YAxis 
                domain={yAxisDomain}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => formatCurrency(value).replace('.00', '')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill={(entry) => entry.month === currentMonth ? '#2563EB' : '#93C5FD'}
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center space-x-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary-600 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">This Year</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Last Year</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
