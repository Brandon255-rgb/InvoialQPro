import { IconType } from 'react-icons';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, trendValue }: StatCardProps) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{displayValue}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-full">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
      {trend && trendValue && (
        <div className="mt-4 flex items-center">
          {trend === 'up' ? (
            <FiTrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <FiTrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={`ml-2 text-sm font-medium ${
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
} 