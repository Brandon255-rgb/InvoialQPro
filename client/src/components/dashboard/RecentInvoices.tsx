import React from "react";
import { Link } from "wouter";
import { formatCurrency, getInitials, getStatusColor } from "@/lib/utils";

interface InvoiceClient {
  id: number;
  name: string;
  company?: string;
}

interface RecentInvoice {
  id: number;
  invoiceNumber: string;
  total: number;
  status: string;
  issueDate: string;
  client: InvoiceClient;
}

interface RecentInvoicesProps {
  invoices: RecentInvoice[];
}

const RecentInvoices: React.FC<RecentInvoicesProps> = ({ invoices }) => {
  return (
    <div className="bg-white shadow-sm rounded-lg lg:col-span-2">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Invoices</h3>
          <Link href="/invoices" className="text-sm font-medium text-primary-600 hover:text-primary-500">
            View all
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => {
              const statusColors = getStatusColor(invoice.status);
              return (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{invoice.invoiceNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-800">
                          {getInitials(invoice.client.name)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{invoice.client.name}</div>
                        {invoice.client.company && (
                          <div className="text-sm text-gray-500">{invoice.client.company}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(invoice.total)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors.bg} ${statusColors.text}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.issueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/invoices/${invoice.id}`} className="text-primary-600 hover:text-primary-900 mr-3">
                      <i className="fas fa-eye"></i>
                    </Link>
                    <button className="text-gray-600 hover:text-gray-900">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
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

export default RecentInvoices;
