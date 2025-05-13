import { format } from 'date-fns';

interface Activity {
  id: string;
  type: 'invoice_created' | 'invoice_paid' | 'client_added' | 'invoice_updated';
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const activityIcons = {
  invoice_created: '📄',
  invoice_paid: '💰',
  client_added: '👤',
  invoice_updated: '✏️',
};

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="border-t border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <li key={activity.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-xl" role="img" aria-label={activity.type}>
                    {activityIcons[activity.type]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 