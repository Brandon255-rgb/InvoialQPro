import React from "react";
import { formatCurrency } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  percentChange?: number;
  currency?: boolean;
  detailsLink?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  percentChange,
  currency = false,
  detailsLink,
}) => {
  const formattedValue = currency ? formatCurrency(Number(value)) : value;
  
  const isPositiveChange = percentChange && percentChange > 0;
  const isNegativeChange = percentChange && percentChange < 0;
  
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${iconBgColor}`}>
            <i className={`${icon} ${iconColor} text-xl`}></i>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{formattedValue}</p>
                  {percentChange && (
                    <p 
                      className={`ml-2 flex items-baseline text-sm font-semibold ${
                        isPositiveChange 
                          ? 'text-success-600' 
                          : isNegativeChange 
                          ? 'text-danger-600'
                          : 'text-gray-500'
                      }`}
                    >
                      <i 
                        className={`fas fa-arrow-${isPositiveChange ? 'up' : 'down'} mr-0.5`}
                      ></i>
                      {Math.abs(percentChange)}%
                    </p>
                  )}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {detailsLink && (
        <div className="bg-gray-50 px-4 py-3 sm:px-6">
          <div className="text-sm text-right">
            <a href={detailsLink} className="font-medium text-primary-600 hover:text-primary-500">
              View details<span className="sr-only"> for {title.toLowerCase()}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
