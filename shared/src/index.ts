export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  isRecurring: boolean;
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
  nextInvoiceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertClient {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
}

export interface InsertInvoice {
  invoiceNumber: string;
  clientId: string;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  isRecurring: boolean;
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
  nextInvoiceDate?: Date;
}

export interface InsertInvoiceItem {
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Runtime constants
export const INVOICE_STATUSES = [
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled',
] as const;

export const INVOICE_FREQUENCIES = [
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'annually',
] as const;

// Example runtime validation function
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidStatus(status: string): boolean {
  return (INVOICE_STATUSES as readonly string[]).includes(status);
}

// Zod schemas from schema.ts
import { insertClientSchema, insertUserSchema, insertItemSchema, insertInvoiceSchema, insertInvoiceItemSchema, insertReminderSchema, insertTeamMemberSchema, insertAuditLogSchema } from '../schema';

export { insertClientSchema, insertUserSchema, insertItemSchema, insertInvoiceSchema, insertInvoiceItemSchema, insertReminderSchema, insertTeamMemberSchema, insertAuditLogSchema }; 