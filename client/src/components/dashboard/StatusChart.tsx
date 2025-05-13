import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  TooltipItem,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Invoice } from '../../types/invoice';

ChartJS.register(ArcElement, Tooltip, Legend);

interface StatusChartProps {
  invoices: Invoice[];
}

export default function StatusChart({ invoices }: StatusChartProps) {
  // Count invoices by status
  const statusCounts = invoices.reduce((acc, invoice) => {
    acc[invoice.status] = (acc[invoice.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data: ChartData<'doughnut'> = {
    labels: Object.keys(statusCounts).map(status => 
      status.charAt(0).toUpperCase() + status.slice(1)
    ),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',  // green for paid
          'rgba(234, 179, 8, 0.8)',  // yellow for pending
          'rgba(239, 68, 68, 0.8)',  // red for overdue
          'rgba(156, 163, 175, 0.8)', // gray for draft
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)',
          'rgb(156, 163, 175)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Invoice Status Distribution',
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'doughnut'>) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <Doughnut data={data} options={options} />
    </div>
  );
} 