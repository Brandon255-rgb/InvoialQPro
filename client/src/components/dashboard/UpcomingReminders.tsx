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
  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Reminders</h3>
        <button 
          onClick={onAddReminder}
          className="text-sm text-primary-600 hover:text-primary-500"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {reminders.length > 0 ? (
          reminders.map((reminder) => (
            <a
              key={reminder.id}
              href="#"
              className="block text-sm text-gray-900 hover:text-primary-600 transition-colors"
            >
              {reminder.title}
            </a>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center">No reminders</p>
        )}
      </div>
    </div>
  );
};

export default UpcomingReminders;
