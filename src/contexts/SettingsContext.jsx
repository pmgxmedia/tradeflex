import { createContext, useState, useContext, useEffect } from 'react';
import { getSettings } from '../services/api';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

const SettingsLoader = ({ settings }) => {
  const initial = settings.siteName?.charAt(0) || 'E';
  const name = settings.siteName || 'EStore';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-900 rounded-2xl flex items-center justify-center animate-bounce shadow-xl shadow-blue-500/30">
          <span className="text-white font-black text-3xl sm:text-4xl italic">
            {initial}
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          {name}
        </div>
      </div>
    </div>
  );
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    siteName: 'EStore',
    siteEmail: 'admin@estore.com',
    currency: 'ZAR',
    timezone: 'Africa/Johannesburg',
    language: 'English',
    // Default values to prevent undefined errors
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err.message);
      // Keep default settings on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = () => {
    return fetchSettings();
  };

  const value = {
    settings,
    loading,
    error,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {loading ? <SettingsLoader settings={settings} /> : children}
    </SettingsContext.Provider>
  );
};
