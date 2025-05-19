"use client";

import React from 'react';
import { useNotificationStore } from '@/lib/notification-store';
import { X, Check, AlertCircle, Info } from 'lucide-react';

export function NotificationToast() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg transition-all transform translate-y-0 opacity-100 pointer-events-auto
            ${notification.type === 'success' ? 'bg-green-600 border-green-700' : 
              notification.type === 'error' ? 'bg-red-600 border-red-700' : 
              notification.type === 'warning' ? 'bg-yellow-600 border-yellow-700' : 
              'bg-blue-600 border-blue-700'} 
            border-l-4 text-white`}
          role="alert"
          style={{animation: 'slideInAndBounce 0.5s ease-out'}}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {notification.type === 'success' ? (
                <div className="bg-white/20 rounded-full p-1">
                  <Check size={16} className="text-white" />
                </div>
              ) : notification.type === 'error' ? (
                <div className="bg-white/20 rounded-full p-1">
                  <AlertCircle size={16} className="text-white" />
                </div>
              ) : (
                <div className="bg-white/20 rounded-full p-1">
                  <Info size={16} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{notification.title}</h3>
              <p className="text-sm opacity-95 mt-1">{notification.message}</p>
            </div>
            <button 
              onClick={() => removeNotification(notification.id)}
              className="text-white/80 hover:text-white transition-colors flex-shrink-0 -mt-1 -mr-1"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
      <style jsx global>{`
        @keyframes slideInAndBounce {
          0% { transform: translateX(120%); opacity: 0; }
          70% { transform: translateX(-5%); opacity: 1; }
          85% { transform: translateX(2%); opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
