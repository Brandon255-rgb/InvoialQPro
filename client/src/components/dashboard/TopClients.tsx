import React from "react";
import { Link } from "wouter";
import { formatCurrency, getInitials, getRandomColor } from "@/lib/utils";

interface TopClient {
  id: number;
  name: string;
  company?: string;
  email: string;
  revenue: number;
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  paymentRate: number;
  lastActivity: string;
}

interface TopClientsProps {
  clients: TopClient[];
}

const TopClients: React.FC<TopClientsProps> = ({ clients }) => {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Top Clients</h3>
          <Link href="/clients" className="text-sm font-medium text-primary-600 hover:text-primary-500">
            View all clients
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoices
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Rate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client, index) => {
              const colorClass = getRandomColor(index);
              const lastActivityDate = new Date(client.lastActivity);
              
              return (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}>
                        <span className="text-sm font-medium">
                          {getInitials(client.name)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.company || client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(client.revenue)}</div>
                    <div className="text-xs text-success-600">
                      ↑ 12% from last year
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.invoices.total} total</div>
                    <div className="text-xs text-gray-500">
                      {client.invoices.paid} paid, {client.invoices.pending} pending
                      {client.invoices.overdue > 0 && `, ${client.invoices.overdue} overdue`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            client.paymentRate >= 80 
                              ? 'bg-success-500' 
                              : client.paymentRate >= 60 
                              ? 'bg-success-400' 
                              : client.paymentRate >= 40 
                              ? 'bg-warning-500'
                              : 'bg-danger'
                          }`}
                          style={{ width: `${client.paymentRate}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-900">{Math.round(client.paymentRate)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lastActivityDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopClients;
