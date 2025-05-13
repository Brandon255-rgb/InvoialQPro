import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Invoice } from '../../types/invoice';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueChartProps {
  invoices: Invoice[];
  period?: 'week' | 'month' | 'year';
}

export default function RevenueChart({ invoices, period = 'month' }: RevenueChartProps) {
  // Group invoices by date based on period
  const groupedInvoices = invoices.reduce((acc, invoice) => {
    const date = new Date(invoice.issue_date);
    let key: string;

    switch (period) {
      case 'week':
        key = date.toLocaleDateString('en-US', { weekday: 'short' });
        break;
      case 'month':
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        break;
      case 'year':
        key = date.toLocaleDateString('en-US', { month: 'short' });
        break;
      default:
        key = date.toLocaleDateString();
    }

    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key] += invoice.total;
    return acc;
  }, {} as Record<string, number>);

  const data: ChartData<'line'> = {
    labels: Object.keys(groupedInvoices),
    datasets: [
      {
        label: 'Revenue',
        data: Object.values(groupedInvoices),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Revenue Over Time',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <Line data={data} options={options} />
    </div>
  );
}
