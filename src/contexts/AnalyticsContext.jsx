import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';

const AnalyticsContext = createContext();

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

// Generate or retrieve session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analyticsSessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analyticsSessionId', sessionId);
  }
  return sessionId;
};

// Generate or retrieve device ID
const getDeviceId = () => {
  let deviceId = localStorage.getItem('analyticsDeviceId');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('analyticsDeviceId', deviceId);
  }
  return deviceId;
};

export const AnalyticsProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [sessionId] = useState(getSessionId());
  const [deviceId] = useState(getDeviceId());
  const lastActivityRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        await fetch(`${API_URL}/analytics/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: user?._id,
            deviceId,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
          }),
        });
      } catch (error) {
        console.error('Failed to initialize analytics session:', error);
      }
    };

    initSession();
  }, [sessionId, deviceId, user, API_URL]);

  // Track page views
  useEffect(() => {
    const trackPage = async () => {
      try {
        const page = location.pathname + location.search;
        await fetch(`${API_URL}/analytics/pageview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            page,
          }),
        });
        lastActivityRef.current = Date.now();
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPage();
  }, [location, sessionId, API_URL]);

  // Heartbeat to keep session alive and update duration
  useEffect(() => {
    const heartbeat = async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // Only send heartbeat if user was recently active (within 5 minutes)
      if (timeSinceLastActivity < 5 * 60 * 1000) {
        try {
          await fetch(`${API_URL}/analytics/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              userId: user?._id,
              deviceId,
              userAgent: navigator.userAgent,
            }),
          });
        } catch (error) {
          console.error('Failed to send heartbeat:', error);
        }
      }
    };

    // Send heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(heartbeat, 30000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [sessionId, deviceId, user, API_URL]);

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track various user interactions
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('click', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, []);

  // End session on page unload
  useEffect(() => {
    const endSession = async () => {
      try {
        // Use sendBeacon for reliability on page unload
        const blob = new Blob(
          [JSON.stringify({ sessionId })],
          { type: 'application/json' }
        );
        navigator.sendBeacon(`${API_URL}/analytics/session/end`, blob);
      } catch (error) {
        console.error('Failed to end session:', error);
      }
    };

    window.addEventListener('beforeunload', endSession);
    window.addEventListener('pagehide', endSession);

    return () => {
      window.removeEventListener('beforeunload', endSession);
      window.removeEventListener('pagehide', endSession);
    };
  }, [sessionId, API_URL]);

  // Track product view
  const trackProductView = useCallback(async (productId, productName, category) => {
    try {
      await fetch(`${API_URL}/analytics/productview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          productId,
          productName,
          category,
        }),
      });
      lastActivityRef.current = Date.now();
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  }, [sessionId, API_URL]);

  const value = {
    sessionId,
    deviceId,
    trackProductView,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};
