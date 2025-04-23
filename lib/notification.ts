import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id,
          ...notification,
          duration: notification.duration || 5000,
        },
      ],
    }));
    
    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, notification.duration || 5000);
    
    return id;
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  clearNotifications: () => {
    set({ notifications: [] });
  },
}));

// Simplified toast function for ease of use
export const notify = {
  success: (title: string, message: string, duration?: number) => {
    return useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  },
  error: (title: string, message: string, duration?: number) => {
    return useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      message,
      duration,
    });
  },
  info: (title: string, message: string, duration?: number) => {
    return useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  },
  warning: (title: string, message: string, duration?: number) => {
    return useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      duration,
    });
  },
};
