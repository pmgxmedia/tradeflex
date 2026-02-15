import { useState, useEffect, useCallback, useRef } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { getSettings, updateSettingSection, updateSettings, resetSettings } from '../../services/api';
import { useSettings } from '../../contexts/SettingsContext';
import { 
  FiSettings, 
  FiMail, 
  FiCreditCard, 
  FiShield, 
  FiGlobe,
  FiBell,
  FiDatabase,
  FiRefreshCw,
  FiSave,
  FiAlertCircle
} from 'react-icons/fi';

const AdminSettings = () => {
  const { refreshSettings: refreshGlobalSettings } = useSettings();
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(null);
  const alertTimeoutRef = useRef(null);

  const [settings, setSettings] = useState({
    // General
    siteName: 'EStore',
    siteEmail: 'admin@estore.com',
    currency: 'ZAR',
    timezone: 'Africa/Johannesburg',
    language: 'English',
    
    // Email
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    emailFromName: 'EStore',
    emailFromAddress: 'noreply@estore.com',
    
    // Payment
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    paypalEnabled: false,
    paypalClientId: '',
    paypalClientSecret: '',
    
    // Bank Details for EFT
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankBranchCode: '',
    bankAccountType: '',
    bankSwiftCode: '',
    bankReference: '',
    
    // Security
    twoFactorAuth: false,
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing maintenance. Please check back soon.',
    
    // Notifications
    orderNotifications: true,
    lowStockAlerts: true,
    lowStockThreshold: 10,
    reviewNotifications: true,
  });

  // Memoized fetchSettings to prevent infinite loops
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching settings from API...');
      const data = await getSettings();
      console.log('Settings received:', data);
      // Use only the fetched data, not merged with initial state
      setSettings(data);
      setOriginalSettings(data);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      showAlert('Failed to load settings: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Track changes
  useEffect(() => {
    if (originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  const showAlert = (message, type = 'success') => {
    // Clear any existing timeout
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    
    setAlert({ show: true, message, type });
    alertTimeoutRef.current = setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
      alertTimeoutRef.current = null;
    }, 4000);
  };

  // Cleanup alert timeout on unmount
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  const handleSaveSettings = async (section) => {
    try {
      setSaving(true);
      
      // Define which fields belong to which section
      const sectionFields = {
        general: { siteName: settings.siteName, siteEmail: settings.siteEmail, currency: settings.currency, timezone: settings.timezone, language: settings.language },
        email: { smtpHost: settings.smtpHost, smtpPort: settings.smtpPort, smtpUsername: settings.smtpUsername, smtpPassword: settings.smtpPassword, emailFromName: settings.emailFromName, emailFromAddress: settings.emailFromAddress },
        payment: { stripeEnabled: settings.stripeEnabled, stripePublishableKey: settings.stripePublishableKey, stripeSecretKey: settings.stripeSecretKey, paypalEnabled: settings.paypalEnabled, paypalClientId: settings.paypalClientId, paypalClientSecret: settings.paypalClientSecret },
        bankDetails: { bankName: settings.bankName, bankAccountName: settings.bankAccountName, bankAccountNumber: settings.bankAccountNumber, bankBranchCode: settings.bankBranchCode, bankAccountType: settings.bankAccountType, bankSwiftCode: settings.bankSwiftCode, bankReference: settings.bankReference },
        security: { twoFactorAuth: settings.twoFactorAuth, maintenanceMode: settings.maintenanceMode, maintenanceMessage: settings.maintenanceMessage },
        notifications: { orderNotifications: settings.orderNotifications, lowStockAlerts: settings.lowStockAlerts, lowStockThreshold: settings.lowStockThreshold, reviewNotifications: settings.reviewNotifications },
      };

      console.log(`Saving ${section} settings:`, sectionFields[section]);
      const result = await updateSettingSection(section, sectionFields[section]);
      console.log('Save result:', result);
      
      // Update settings with the server response to ensure consistency
      if (result && result.settings) {
        console.log('Updating state with server response:', result.settings);
        setSettings(result.settings);
        setOriginalSettings(result.settings);
        // Refresh global settings to update navbar/footer
        await refreshGlobalSettings();
      } else {
        // Fallback: refetch settings to ensure we have the latest data
        console.log('No settings in response, refetching...');
        await fetchSettings();
        await refreshGlobalSettings();
      }
      
      setHasChanges(false);
      showAlert(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully`);
    } catch (error) {
      console.error('Failed to save settings:', error);
      showAlert('Failed to save settings: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllSettings = async () => {
    try {
      setSaving(true);
      
      // Clean settings data - remove MongoDB internal fields
      const cleanSettings = { ...settings };
      delete cleanSettings._id;
      delete cleanSettings.__v;
      delete cleanSettings.createdAt;
      delete cleanSettings.updatedAt;
      delete cleanSettings.singleton;
      
      console.log('Saving all settings:', cleanSettings);
      const result = await updateSettings(cleanSettings);
      console.log('Save all result:', result);
      
      // Update settings with the server response to ensure consistency
      if (result && result.settings) {
        console.log('Updating state with server response:', result.settings);
        setSettings(result.settings);
        setOriginalSettings(result.settings);
        // Refresh global settings to update navbar/footer
        await refreshGlobalSettings();
      } else {
        // Fallback: refetch settings to ensure we have the latest data
        console.log('No settings in response, refetching...');
        await fetchSettings();
        await refreshGlobalSettings();
      }
      
      setHasChanges(false);
      showAlert('All settings saved successfully');
    } catch (error) {
      console.error('Failed to save all settings:', error);
      showAlert('Failed to save all settings: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    try {
      setSaving(true);
      console.log('Resetting settings to defaults...');
      const response = await resetSettings();
      console.log('Reset response:', response);
      const resetData = response.settings || response;
      // Set settings first, then update original settings with the same data
      setSettings(resetData);
      setOriginalSettings(resetData);
      setHasChanges(false);
      setShowResetModal(false);
      // Refresh global settings to update navbar/footer
      await refreshGlobalSettings();
      showAlert('Settings reset to defaults successfully');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      showAlert('Failed to reset settings: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setSettings({ ...originalSettings });
    setHasChanges(false);
    showAlert('Changes discarded', 'info');
  };

  const tabs = [
    { id: 'general', name: 'General', icon: FiSettings },
    { id: 'email', name: 'Email', icon: FiMail },
    { id: 'payment', name: 'Payment', icon: FiCreditCard },
    { id: 'bankDetails', name: 'Bank Details', icon: FiCreditCard },
    { id: 'security', name: 'Security', icon: FiShield },
    { id: 'notifications', name: 'Notifications', icon: FiBell },
    { id: 'advanced', name: 'Advanced', icon: FiDatabase },
  ];

  return (
    <div className="space-y-6">
      {alert.show && <Alert type={alert.type} message={alert.message} />}

      {/* Header with Actions */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="home-hero-heading text-2xl font-bold text-gray-900">Settings Management</h2>
          <p className="text-gray-600 mt-1">Configure and manage your store settings</p>
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <Button 
              variant="outline" 
              onClick={handleDiscardChanges}
              disabled={saving}
            >
              Discard Changes
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => setShowResetModal(true)}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            Reset to Defaults
          </Button>
          {hasChanges && (
            <Button 
              onClick={handleSaveAllSettings}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <FiSave className="w-4 h-4" />
              {saving ? 'Saving All...' : 'Save All Changes'}
            </Button>
          )}
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasChanges && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-900">You have unsaved changes</p>
              <p className="text-sm text-yellow-700">Remember to save your changes before leaving this page</p>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Sidebar */}
        <Card className="p-4 lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'general' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FiSettings className="w-5 h-5 mr-2" />
                General Settings
              </h3>
              <div className="space-y-4">
                <Input
                  label="Site Name"
                  value={settings.siteName || ''}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                />
                <Input
                  label="Site Email"
                  type="email"
                  value={settings.siteEmail || ''}
                  onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ZAR">ZAR (R)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Africa/Johannesburg">South African Standard Time (SAST - UTC+2)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET - UTC-5/-4)</option>
                    <option value="America/Chicago">Central Time (CT - UTC-6/-5)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT - UTC-8/-7)</option>
                    <option value="Europe/London">British Time (GMT/BST - UTC+0/+1)</option>
                    <option value="Europe/Paris">Central European Time (CET - UTC+1/+2)</option>
                    <option value="Asia/Tokyo">Japan Standard Time (JST - UTC+9)</option>
                    <option value="Australia/Sydney">Australian Eastern Time (AET - UTC+10/+11)</option>
                  </select>
                </div>
                <div className="pt-4">
                  <Button onClick={() => handleSaveSettings('general')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'email' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FiMail className="w-5 h-5 mr-2" />
                Email Settings
              </h3>
              <div className="space-y-4">
                <Input 
                  label="SMTP Host" 
                  placeholder="smtp.example.com" 
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                />
                <Input 
                  label="SMTP Port" 
                  type="number"
                  placeholder="587" 
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                />
                <Input 
                  label="SMTP Username" 
                  placeholder="user@example.com" 
                  value={settings.smtpUsername}
                  onChange={(e) => setSettings({ ...settings, smtpUsername: e.target.value })}
                />
                <Input 
                  label="SMTP Password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={settings.smtpPassword}
                  onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                />
                <Input 
                  label="From Name" 
                  placeholder="EStore" 
                  value={settings.emailFromName}
                  onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                />
                <Input 
                  label="From Email Address" 
                  type="email"
                  placeholder="noreply@estore.com" 
                  value={settings.emailFromAddress}
                  onChange={(e) => setSettings({ ...settings, emailFromAddress: e.target.value })}
                />
                <div className="pt-4">
                  <Button onClick={() => handleSaveSettings('email')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Email Settings'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'payment' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FiCreditCard className="w-5 h-5 mr-2" />
                Payment Settings
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                      <FiCreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Stripe</p>
                      <p className="text-sm text-gray-600">Accept credit card payments</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={settings.stripeEnabled}
                      onChange={(e) => setSettings({ ...settings, stripeEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded" 
                    />
                    <span className="text-sm text-gray-700">Enabled</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded flex items-center justify-center">
                      <FiCreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">PayPal</p>
                      <p className="text-sm text-gray-600">PayPal payment gateway</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={settings.paypalEnabled}
                      onChange={(e) => setSettings({ ...settings, paypalEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded" 
                    />
                    <span className="text-sm text-gray-700">Enabled</span>
                  </div>
                </div>

                <Input 
                  label="Stripe Publishable Key" 
                  placeholder="pk_test_..." 
                  value={settings.stripePublishableKey}
                  onChange={(e) => setSettings({ ...settings, stripePublishableKey: e.target.value })}
                />
                <Input 
                  label="Stripe Secret Key" 
                  type="password" 
                  placeholder="sk_test_..." 
                  value={settings.stripeSecretKey}
                  onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                />
                <Input 
                  label="PayPal Client ID" 
                  placeholder="AY..." 
                  value={settings.paypalClientId}
                  onChange={(e) => setSettings({ ...settings, paypalClientId: e.target.value })}
                />
                <Input 
                  label="PayPal Client Secret" 
                  type="password" 
                  placeholder="EL..." 
                  value={settings.paypalClientSecret}
                  onChange={(e) => setSettings({ ...settings, paypalClientSecret: e.target.value })}
                />
                
                <div className="pt-4">
                  <Button onClick={() => handleSaveSettings('payment')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Payment Settings'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'bankDetails' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FiCreditCard className="w-5 h-5 mr-2" />
                Bank Details for EFT Payments
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> These bank details will be displayed to customers who select EFT (Electronic Funds Transfer) as their payment method during checkout. Please ensure all information is accurate.
                </p>
              </div>
              <div className="space-y-4">
                <Input 
                  label="Bank Name" 
                  placeholder="e.g., First National Bank" 
                  value={settings.bankName || ''}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  helperText="The name of your bank"
                />
                <Input 
                  label="Account Holder Name" 
                  placeholder="e.g., EStore (Pty) Ltd" 
                  value={settings.bankAccountName || ''}
                  onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                  helperText="The name on the bank account"
                />
                <Input 
                  label="Account Number" 
                  placeholder="e.g., 1234567890" 
                  value={settings.bankAccountNumber || ''}
                  onChange={(e) => setSettings({ ...settings, bankAccountNumber: e.target.value })}
                  helperText="Your bank account number"
                />
                <Input 
                  label="Branch Code" 
                  placeholder="e.g., 250655" 
                  value={settings.bankBranchCode || ''}
                  onChange={(e) => setSettings({ ...settings, bankBranchCode: e.target.value })}
                  helperText="The branch code or sort code"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type
                  </label>
                  <select
                    value={settings.bankAccountType || ''}
                    onChange={(e) => setSettings({ ...settings, bankAccountType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Account Type</option>
                    <option value="Cheque">Cheque Account</option>
                    <option value="Savings">Savings Account</option>
                    <option value="Current">Current Account</option>
                    <option value="Business">Business Account</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Type of bank account</p>
                </div>
                <Input 
                  label="SWIFT/BIC Code (Optional)" 
                  placeholder="e.g., FIRNZAJJ" 
                  value={settings.bankSwiftCode || ''}
                  onChange={(e) => setSettings({ ...settings, bankSwiftCode: e.target.value })}
                  helperText="Required for international transfers"
                />
                <Input 
                  label="Payment Reference Instruction" 
                  placeholder="e.g., Use your order number as reference" 
                  value={settings.bankReference || ''}
                  onChange={(e) => setSettings({ ...settings, bankReference: e.target.value })}
                  helperText="Instructions for customers on what to use as payment reference"
                />
                
                <div className="pt-4">
                  <Button onClick={() => handleSaveSettings('bankDetails')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Bank Details'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FiShield className="w-5 h-5 mr-2" />
                Security Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={settings.twoFactorAuth}
                      onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded" 
                    />
                    <span className="text-sm text-gray-700">
                      {settings.twoFactorAuth ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Maintenance Mode</p>
                    <p className="text-sm text-gray-600">Put site in maintenance mode</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded" 
                    />
                    <span className="text-sm text-gray-700">
                      {settings.maintenanceMode ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={() => handleSaveSettings('security')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Security Settings'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FiBell className="w-5 h-5 mr-2" />
                Notification Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Order Notifications</p>
                    <p className="text-sm text-gray-600">Get notified when new orders arrive</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={settings.orderNotifications}
                      onChange={(e) => setSettings({ ...settings, orderNotifications: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Low Stock Alerts</p>
                    <p className="text-sm text-gray-600">Alert when products are running low</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={settings.lowStockAlerts}
                      onChange={(e) => setSettings({ ...settings, lowStockAlerts: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded" 
                    />
                  </div>
                </div>

                <Input 
                  label="Low Stock Threshold" 
                  type="number"
                  placeholder="10" 
                  value={settings.lowStockThreshold}
                  onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 10 })}
                  helperText="Send alert when stock falls below this number"
                />

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Customer Reviews</p>
                    <p className="text-sm text-gray-600">Notify on new product reviews</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={settings.reviewNotifications}
                      onChange={(e) => setSettings({ ...settings, reviewNotifications: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded" 
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={() => handleSaveSettings('notifications')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Notification Settings'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'advanced' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FiDatabase className="w-5 h-5 mr-2" />
                Advanced Settings Management
              </h3>
              
              <div className="space-y-6">
                {/* Settings Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Settings Overview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600">Total Settings</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {Object.keys(settings).length}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600">Modified</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {hasChanges ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600">Categories</p>
                      <p className="text-2xl font-bold text-green-600">5</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="text-2xl font-bold text-orange-600">Active</p>
                    </div>
                  </div>
                </div>

                {/* Settings Table */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">All Settings</h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Setting Key
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(settings).map(([key, value]) => {
                          // Determine category
                          let category = 'Other';
                          if (['siteName', 'siteEmail', 'currency', 'timezone', 'language'].includes(key)) {
                            category = 'General';
                          } else if (key.includes('smtp') || key.includes('email') || key.includes('Email')) {
                            category = 'Email';
                          } else if (key.includes('stripe') || key.includes('paypal') || key.includes('Stripe') || key.includes('Paypal')) {
                            category = 'Payment';
                          } else if (key.includes('Auth') || key.includes('maintenance') || key.includes('Maintenance')) {
                            category = 'Security';
                          } else if (key.includes('Notification') || key.includes('Alert') || key.includes('Stock')) {
                            category = 'Notifications';
                          }

                          // Display value
                          let displayValue = value;
                          if (typeof value === 'boolean') {
                            displayValue = value ? '✓ Enabled' : '✗ Disabled';
                          } else if (key.includes('password') || key.includes('Password') || key.includes('secret') || key.includes('Secret')) {
                            displayValue = '••••••••';
                          } else if (typeof value === 'string' && value.length > 50) {
                            displayValue = value.substring(0, 47) + '...';
                          }

                          return (
                            <tr key={key} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {key}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {String(displayValue)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {typeof value}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  category === 'General' ? 'bg-blue-100 text-blue-800' :
                                  category === 'Email' ? 'bg-purple-100 text-purple-800' :
                                  category === 'Payment' ? 'bg-green-100 text-green-800' :
                                  category === 'Security' ? 'bg-red-100 text-red-800' :
                                  category === 'Notifications' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {category}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bulk Actions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Bulk Actions</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => fetchSettings()}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      <FiRefreshCw className="w-4 h-4" />
                      Refresh Settings
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={handleSaveAllSettings}
                      disabled={!hasChanges || saving}
                      className="flex items-center gap-2"
                    >
                      <FiSave className="w-4 h-4" />
                      Save All Settings
                    </Button>
                    <Button 
                      variant="danger" 
                      onClick={() => setShowResetModal(true)}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      <FiRefreshCw className="w-4 h-4" />
                      Reset All to Defaults
                    </Button>
                  </div>
                </div>

                {/* Settings JSON Export */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Export Settings</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Export your current settings as JSON for backup or migration purposes.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const dataStr = JSON.stringify(settings, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `estore-settings-${new Date().toISOString().split('T')[0]}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                      showAlert('Settings exported successfully', 'success');
                    }}
                  >
                    Export Settings JSON
                  </Button>
                </div>
              </div>
            </Card>
          )}
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Settings to Defaults"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
            <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Warning: This action cannot be undone</p>
              <p className="text-sm text-red-700 mt-1">
                All your custom settings will be permanently reset to their default values. 
                This includes all general, email, payment, security, and notification settings.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowResetModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleResetSettings}
              disabled={saving}
            >
              {saving ? 'Resetting...' : 'Reset to Defaults'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSettings;
