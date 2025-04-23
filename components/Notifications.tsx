"use client";

import React from 'react';
import { useNotificationStore } from '@/lib/notification';

export function Notifications() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-md shadow-md transition-all transform animate-in slide-in-from-right duration-300 max-w-sm ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            notification.type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
          }`}
          role="alert"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-sm">{notification.title}</h3>
              <p className="text-xs mt-1">{notification.message}</p>
            </div>
            <button 
              onClick={() => removeNotification(notification.id)}
              className="text-white ml-3"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
