import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const DeliveryNotificationContext = createContext();

export const useDeliveryNotifications = () => {
  const context = useContext(DeliveryNotificationContext);
  if (!context) {
    throw new Error('useDeliveryNotifications must be used within DeliveryNotificationProvider');
  }
  return context;
};

export const DeliveryNotificationProvider = ({ children, providerId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add a new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/notification-icon.png',
        badge: '/badge-icon.png',
        tag: newNotification.id
      });
    }

    // Play notification sound
    playNotificationSound();
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  // Clear a notification
  const clearNotification = (notificationId) => {
    setNotifications((prev) => {
      const notif = prev.find((n) => n.id === notificationId);
      if (notif && !notif.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll
  };

  return (
    <DeliveryNotificationContext.Provider value={value}>
      {children}
    </DeliveryNotificationContext.Provider>
  );
};

DeliveryNotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
  providerId: PropTypes.string
};

export default DeliveryNotificationContext;
