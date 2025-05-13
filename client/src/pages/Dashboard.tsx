import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchDashboardData, DashboardStats } from '../services/dashboard';
import StatCard from '../components/dashboard/StatCard';
import RecentInvoices from '../components/dashboard/RecentInvoices';
import RevenueChart from '../components/dashboard/RevenueChart';
import StatusChart from '../components/dashboard/StatusChart';
import Loading from '../components/ui/Loading';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { FiDollarSign, FiClock, FiAlertCircle } from 'react-icons/fi';

interface Invoice {
  id: number;
  invoiceNumber: string;
  total: number;
  status: string;
  issueDate: string;
  client: {
    id: number;
    name: string;
    company?: string;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await fetchDashboardData();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/invoices');
        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }
        const data = await response.json();
        setInvoices(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    fetchInvoices();
  }, []);

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error: {error}
      </div>
    );
  }

  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending');
  const overdueInvoices = invoices.filter(invoice => invoice.status === 'overdue');
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Welcome back, {user?.name}
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Here's what's happening with your invoices today.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          value={totalRevenue}
          icon={FiDollarSign}
          trend="up"
          trendValue="12%"
        />
        <StatCard
          title="Pending Invoices"
          value={pendingInvoices.length}
          icon={FiClock}
          trend="up"
          trendValue="8%"
        />
        <StatCard
          title="Overdue Invoices"
          value={overdueInvoices.length}
          icon={FiAlertCircle}
          trend="down"
          trendValue="3%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart invoices={invoices} period={period} />
        <StatusChart invoices={invoices} />
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
          <RecentInvoices invoices={recentInvoices} />
        </div>
      </div>
    </div>
  );
} 