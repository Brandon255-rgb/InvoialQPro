export interface Invoice {
  id: number;
  user_id: number;
  client_id: number;
  invoice_number: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  created_at: string;
  client: {
    id: number;
    name: string;
    company?: string;
    email: string;
    phone?: string;
    address?: string;
  };
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  item_id?: number;
  description: string;
  quantity: number;
  price: number;
  total: number;
  item?: {
    id: number;
    name: string;
    description?: string;
    price: number;
    category?: string;
  };
} 