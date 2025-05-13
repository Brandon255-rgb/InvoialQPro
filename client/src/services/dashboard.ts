import axios from 'axios';

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
    const response = await axios.get<DashboardStats>('/api/dashboard');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
    throw error;
  }
}; 