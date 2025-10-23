import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { formatDate } from '../../lib/utils';
import io, { Socket } from 'socket.io-client';

interface Notification {
  _id: string;
  type: 'transaction' | 'payment_request' | 'settlement' | 'withdrawal' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    try {
      // Connect to Socket.IO server
      const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        autoConnect: true,
        path: '/socket.io/',
      });

      setSocket(socketInstance);

      // Handle connection events
      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        // Join user's room
        socketInstance.emit('join', user._id);
      });

      socketInstance.on('connect_error', (error) => {
        console.warn('Socket connection error (notifications will be disabled):', error.message);
        // Don't throw - just log the error and continue without real-time notifications
      });

      socketInstance.on('error', (error) => {
        console.warn('Socket error:', error);
      });

      // Listen for notifications
      socketInstance.on('notification', (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        
        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
          });
        }
      });

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => {
        socketInstance.disconnect();
      };
    } catch (error) {
      console.warn('Failed to initialize notifications:', error);
      // Continue without real-time notifications
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'transaction':
        return '💳';
      case 'payment_request':
        return '📨';
      case 'settlement':
        return '💰';
      case 'withdrawal':
        return '🏦';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 max-h-[32rem] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <span className="font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <div className="flex gap-1 flex-shrink-0">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification._id)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  title="Mark as read"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </button>
                              )}
                              <button
                                onClick={() => clearNotification(notification._id)}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Dismiss"
                              >
                                <X className="h-4 w-4 text-gray-500" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                          {notification.link && (
                            <a
                              href={notification.link}
                              className="text-xs text-primary hover:underline mt-2 inline-block"
                              onClick={() => setIsOpen(false)}
                            >
                              View details →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50 text-center">
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => {
                    setNotifications([]);
                    setIsOpen(false);
                  }}
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;

