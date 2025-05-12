import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { 
  Search, 
  Plus, 
  FileText, 
  Send, 
  MoreVertical, 
  Download, 
  Copy, 
  Trash2 
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface InvoiceClient {
  id: number;
  name: string;
  company?: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  client: InvoiceClient;
}

interface InvoicesListProps {
  invoices: Invoice[];
  isLoading?: boolean;
  onSendInvoice: (id: number) => void;
  onDownloadPdf: (id: number) => void;
  onDeleteInvoice: (id: number) => void;
  onDuplicateInvoice: (id: number) => void;
}

const InvoicesList: React.FC<InvoicesListProps> = ({
  invoices = [],
  isLoading = false,
  onSendInvoice,
  onDownloadPdf,
  onDeleteInvoice,
  onDuplicateInvoice
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Filter invoices based on search query
  const filteredInvoices = invoices.filter(invoice => {
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.client.name.toLowerCase().includes(query) ||
      invoice.status.toLowerCase().includes(query) ||
      formatCurrency(invoice.total).toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (filteredInvoices.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-primary-50 p-6 mb-4">
          <FileText className="h-10 w-10 text-primary-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No invoices yet</h3>
        <p className="text-gray-500 mb-4">Create your first invoice to get started</p>
        <Link href="/invoices/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </Link>
      </div>
    );
  }

  if (filteredInvoices.length === 0 && searchQuery) {
    return (
      <div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500 mb-4">No invoices found matching "{searchQuery}"</p>
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Clear search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => {
              const statusColors = getStatusColor(invoice.status);
              
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    <Link 
                      href={`/invoices/${invoice.id}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      #{invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar>
                        <AvatarFallback>
                          {invoice.client.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-2">
                        <div className="font-medium">{invoice.client.name}</div>
                        {invoice.client.company && (
                          <div className="text-xs text-gray-500">{invoice.client.company}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(invoice.total)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors.bg} ${statusColors.text}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDownloadPdf(invoice.id)}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSendInvoice(invoice.id)}
                        title="Send Invoice"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/invoices/${invoice.id}`}>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => onDuplicateInvoice(invoice.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteInvoice(invoice.id)}
                            className="text-danger"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InvoicesList;
