import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function generateInvoiceNumber(): string {
  const prefix = 'INV';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
}

export function calculateTotals(items: Array<{ quantity: number; price: number; }>): {
  subtotal: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  return {
    subtotal,
    total: subtotal,
  };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getStatusColor(status: string): {
  bg: string;
  text: string;
} {
  switch (status.toLowerCase()) {
    case 'paid':
      return { bg: 'bg-success-100', text: 'text-success-800' };
    case 'pending':
    case 'sent':
      return { bg: 'bg-warning-100', text: 'text-warning-800' };
    case 'overdue':
      return { bg: 'bg-danger-100', text: 'text-danger' };
    case 'draft':
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
    case 'cancelled':
      return { bg: 'bg-gray-100', text: 'text-gray-500' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

export function calculateDaysDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getRandomColor(index: number): string {
  const colors = [
    'bg-primary-100 text-primary-800',
    'bg-accent-100 text-accent-800',
    'bg-success-100 text-success-800',
    'bg-warning-100 text-warning-800',
    'bg-cyan-100 text-cyan-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
  ];
  
  return colors[index % colors.length];
}
