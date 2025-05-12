import React from "react";
import { formatDateTime } from "@/lib/utils";

interface Reminder {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  invoiceId?: number;
}

interface UpcomingRemindersProps {
  reminders: Reminder[];
  onAddReminder: () => void;
}

const UpcomingReminders: React.FC<UpcomingRemindersProps> = ({ 
  reminders,
  onAddReminder
}) => {
  // Function to determine icon and styling based on reminder content
  const getReminderIcon = (reminder: Reminder) => {
    if (reminder.title.toLowerCase().includes("overdue")) {
      return {
        bgColor: "bg-danger-100",
        icon: "fas fa-exclamation-circle text-danger"
      };
    } else if (reminder.title.toLowerCase().includes("reminder")) {
      return {
        bgColor: "bg-warning-100",
        icon: "fas fa-bell text-warning-600"
      };
    } else if (reminder.title.toLowerCase().includes("generate") || 
               reminder.title.toLowerCase().includes("recurring")) {
      return {
        bgColor: "bg-primary-100",
        icon: "fas fa-sync text-primary-600"
      };
    } else {
      return {
        bgColor: "bg-gray-100",
        icon: "fas fa-calendar text-gray-600"
      };
    }
  };

  // Format due date to relative time
  const formatRelativeTime = (dateString: string) => {
    const dueDate = new Date(dateString);
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays === 0) {
      return diffHours <= 0 
        ? "Today" 
        : `Today at ${dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays < 0) {
      return `${Math.abs(diffDays)} days ago`;
    } else {
      return dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Upcoming Reminders</h3>
          <button 
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
            onClick={onAddReminder}
          >
            <i className="fas fa-plus mr-1"></i> Add
          </button>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {reminders.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {reminders.map((reminder) => {
              const { bgColor, icon } = getReminderIcon(reminder);
              return (
                <li key={reminder.id} className="py-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${bgColor}`}>
                        <i className={icon}></i>
                      </span>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{reminder.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{reminder.description}</p>
                      <div className="mt-2 text-xs font-medium text-gray-500">
                        {formatRelativeTime(reminder.dueDate)}
                      </div>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      <button className="text-gray-400 hover:text-gray-500">
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-6 text-center">
            <span className="inline-block rounded-full bg-gray-100 p-3 mb-3">
              <i className="fas fa-calendar text-gray-500 text-xl"></i>
            </span>
            <p className="text-gray-500 mb-2">No upcoming reminders</p>
            <button 
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
              onClick={onAddReminder}
            >
              Add your first reminder
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingReminders;
