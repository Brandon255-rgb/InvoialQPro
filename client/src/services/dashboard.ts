import axios from 'axios';
import { supabase } from '@/lib/supabase';

// Create an axios instance with the base URL and default headers
export const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to include the auth token in requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  recentInvoices: {
    id: string;
    number: string;
    clientName: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    dueDate: string;
  }[];
  recentActivity: {
    id: string;
    type: 'invoice_created' | 'invoice_paid' | 'client_added' | 'invoice_updated';
    description: string;
    timestamp: string;
  }[];
}

export const fetchDashboardData = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get<DashboardStats>('/api/analytics/dashboard');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
    throw error;
  }
}; 