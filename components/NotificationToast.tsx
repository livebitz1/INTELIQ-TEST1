"use client";

import React from 'react';
import { useNotificationStore } from '@/lib/notification-store';
import { X } from 'lucide-react'; // Assuming lucide-react is available since it was imported in the original code

export function NotificationToast() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-md shadow-md transition-all transform translate-y-0 opacity-100 pointer-events-auto
            ${notification.type === 'success' ? 'bg-green-500 border-green-600' : 
              notification.type === 'error' ? 'bg-red-500 border-red-600' : 
              notification.type === 'warning' ? 'bg-yellow-500 border-yellow-600' : 
              'bg-blue-500 border-blue-600'} 
            border text-white`}
          role="alert"
          style={{animation: 'slideIn 0.3s ease-out'}}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{notification.title}</h3>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>
            <button 
              onClick={() => removeNotification(notification.id)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ))}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
