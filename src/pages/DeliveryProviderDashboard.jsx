import { useState, useEffect } from 'react';
import api from '../services/api';
import { DeliveryNotificationProvider, useDeliveryNotifications } from '../contexts/DeliveryNotificationContext';
import DeliveryNotificationBell from '../components/DeliveryNotificationBell';

const DeliveryProviderDashboard = () => {
  const [providerId, setProviderId] = useState(localStorage.getItem('deliveryProviderId') || '');
  const [provider, setProvider] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('available');
  const [availability, setAvailability] = useState('offline');

  // Selected delivery for status update
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    notes: '',
    location: { latitude: '', longitude: '', address: '' }
  });

  // Proof of delivery
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofOfDelivery, setProofOfDelivery] = useState({
    receivedBy: '',
    notes: '',
    signature: '',
    photo: ''
  });

  useEffect(() => {
    if (providerId) {
      fetchProviderData();
      fetchAvailableJobs();
      fetchActiveDeliveries();
      
      // Poll for new jobs every 30 seconds
      const interval = setInterval(() => {
        fetchAvailableJobs();
        fetchActiveDeliveries();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [providerId]);

  const fetchProviderData = async () => {
    try {
      const response = await api.get(`/delivery/provider/${providerId}/history`, {
        params: { limit: 10 }
      });
      setProvider(response.data.provider);
      setDeliveryHistory(response.data.deliveries);
    } catch (err) {
      console.error('Error fetching provider data:', err);
    }
  };

  const fetchAvailableJobs = async () => {
    if (!providerId) return;
    
    try {
      const response = await api.get('/delivery/provider/available-jobs', {
        params: { providerId }
      });
      setAvailableJobs(response.data.jobs);
    } catch (err) {
      console.error('Error fetching available jobs:', err);
    }
  };

  const fetchActiveDeliveries = async () => {
    if (!providerId) return;
    
    try {
      const response = await api.get(`/delivery/provider/${providerId}/history`, {
        params: { 
          status: 'accepted,picked_up,in_transit,out_for_delivery',
          limit: 20 
        }
      });
      setActiveDeliveries(response.data.deliveries);
    } catch (err) {
      console.error('Error fetching active deliveries:', err);
    }
  };

  const handleProviderLogin = (e) => {
    e.preventDefault();
    if (providerId) {
      localStorage.setItem('deliveryProviderId', providerId);
      fetchProviderData();
      fetchAvailableJobs();
      fetchActiveDeliveries();
    }
  };

  const handleRespondToJob = async (jobId, response, reason = '') => {
    try {
      await api.put(`/delivery/provider/jobs/${jobId}/respond`, {
        response,
        rejectionReason: reason,
        providerId
      });
      
      setSuccess(`Job ${response} successfully`);
      fetchAvailableJobs();
      if (response === 'accepted') {
        fetchActiveDeliveries();
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond to job');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedDelivery || !statusUpdate.status) {
      setError('Please select a status');
      return;
    }

    try {
      await api.put(`/delivery/provider/jobs/${selectedDelivery._id}/status`, {
        status: statusUpdate.status,
        location: statusUpdate.location,
        notes: statusUpdate.notes,
        providerId
      });

      setSuccess('Status updated successfully');
      setShowStatusModal(false);
      setSelectedDelivery(null);
      resetStatusUpdate();
      fetchActiveDeliveries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!selectedDelivery || !proofOfDelivery.receivedBy) {
      setError('Please provide receiver name');
      return;
    }

    try {
      await api.put(`/delivery/provider/jobs/${selectedDelivery._id}/complete`, {
        proofOfDelivery,
        providerId
      });

      setSuccess('Delivery completed successfully!');
      setShowProofModal(false);
      setSelectedDelivery(null);
      resetProofOfDelivery();
      fetchActiveDeliveries();
      fetchProviderData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete delivery');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAvailabilityChange = async (newAvailability) => {
    try {
      await api.put(`/delivery/provider/${providerId}/availability`, {
        availability: newAvailability
      });
      setAvailability(newAvailability);
      setSuccess(`Status changed to ${newAvailability}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update availability');
      setTimeout(() => setError(''), 3000);
    }
  };

  const resetStatusUpdate = () => {
    setStatusUpdate({
      status: '',
      notes: '',
      location: { latitude: '', longitude: '', address: '' }
    });
  };

  const resetProofOfDelivery = () => {
    setProofOfDelivery({
      receivedBy: '',
      notes: '',
      signature: '',
      photo: ''
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      accepted: 'bg-cyan-100 text-cyan-800',
      picked_up: 'bg-purple-100 text-purple-800',
      in_transit: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      low: '🟢',
      normal: '🔵',
      high: '🟠',
      urgent: '🔴'
    };
    return icons[priority] || '⚪';
  };

  // If not logged in, show login form
  if (!providerId || !provider) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Delivery Provider Login</h2>
          <form onSubmit={handleProviderLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider ID
              </label>
              <input
                type="text"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                placeholder="Enter your provider ID"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <DeliveryNotificationProvider providerId={providerId}>
      <DashboardContent 
        provider={provider}
        providerId={providerId}
        availableJobs={availableJobs}
        activeDeliveries={activeDeliveries}
        deliveryHistory={deliveryHistory}
        availability={availability}
        error={error}
        success={success}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleAvailabilityChange={handleAvailabilityChange}
        handleRespondToJob={handleRespondToJob}
        selectedDelivery={selectedDelivery}
        setSelectedDelivery={setSelectedDelivery}
        showStatusModal={showStatusModal}
        setShowStatusModal={setShowStatusModal}
        statusUpdate={statusUpdate}
        setStatusUpdate={setStatusUpdate}
        handleUpdateStatus={handleUpdateStatus}
        resetStatusUpdate={resetStatusUpdate}
        showProofModal={showProofModal}
        setShowProofModal={setShowProofModal}
        proofOfDelivery={proofOfDelivery}
        setProofOfDelivery={setProofOfDelivery}
        handleCompleteDelivery={handleCompleteDelivery}
        resetProofOfDelivery={resetProofOfDelivery}
        getStatusBadgeClass={getStatusBadgeClass}
        getPriorityIcon={getPriorityIcon}
      />
    </DeliveryNotificationProvider>
  );
};

const DashboardContent = ({
  provider,
  providerId,
  availableJobs,
  activeDeliveries,
  deliveryHistory,
  availability,
  error,
  success,
  activeTab,
  setActiveTab,
  handleAvailabilityChange,
  handleRespondToJob,
  selectedDelivery,
  setSelectedDelivery,
  showStatusModal,
  setShowStatusModal,
  statusUpdate,
  setStatusUpdate,
  handleUpdateStatus,
  resetStatusUpdate,
  showProofModal,
  setShowProofModal,
  proofOfDelivery,
  setProofOfDelivery,
  handleCompleteDelivery,
  resetProofOfDelivery,
  getStatusBadgeClass,
  getPriorityIcon
}) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Delivery Dashboard</h1>
              <p className="text-gray-600">Welcome, {provider.name}</p>
            </div>
            <div className="flex items-center gap-4">                <DeliveryNotificationBell />              <div className="text-right">
                <div className="text-sm text-gray-600">Rating</div>
                <div className="font-bold">{provider.rating.toFixed(1)} ⭐</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAvailabilityChange('available')}
                  className={`px-4 py-2 rounded ${
                    availability === 'available'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Available
                </button>
                <button
                  onClick={() => handleAvailabilityChange('busy')}
                  className={`px-4 py-2 rounded ${
                    availability === 'busy'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Busy
                </button>
                <button
                  onClick={() => handleAvailabilityChange('offline')}
                  className={`px-4 py-2 rounded ${
                    availability === 'offline'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Offline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}
      {success && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-gray-500 text-sm">Total Deliveries</h3>
            <p className="text-2xl font-bold">{provider.totalDeliveries}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-gray-500 text-sm">Completed</h3>
            <p className="text-2xl font-bold text-green-600">{provider.completedDeliveries}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-gray-500 text-sm">Success Rate</h3>
            <p className="text-2xl font-bold text-blue-600">{provider.successRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-gray-500 text-sm">Available Jobs</h3>
            <p className="text-2xl font-bold text-yellow-600">{availableJobs.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('available')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Available Jobs ({availableJobs.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Active Deliveries ({activeDeliveries.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                History
              </button>
            </nav>
          </div>

          {/* Available Jobs Tab */}
          {activeTab === 'available' && (
            <div className="p-6">
              {availableJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No available jobs at the moment
                </div>
              ) : (
                <div className="grid gap-4">
                  {availableJobs.map((job) => (
                    <div key={job._id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold">
                              {getPriorityIcon(job.priority)} Order #{job.orderId?.orderNumber}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(job.status)}`}>
                              {job.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Delivery Fee: <span className="font-bold text-green-600">${job.deliveryFee}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Customer</h4>
                          <p className="text-sm">{job.customer.name}</p>
                          <p className="text-sm text-gray-600">{job.customer.phone}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Delivery Address</h4>
                          <p className="text-sm">{job.customer.address.street}</p>
                          <p className="text-sm text-gray-600">
                            {job.customer.address.city}, {job.customer.address.state} {job.customer.address.zipCode}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleRespondToJob(job._id, 'rejected', 'Not available')}
                          className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50"
                        >
                          Ignore
                        </button>
                        <button
                          onClick={() => handleRespondToJob(job._id, 'accepted')}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Accept Job
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Deliveries Tab */}
          {activeTab === 'active' && (
            <div className="p-6">
              {activeDeliveries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active deliveries
                </div>
              ) : (
                <div className="grid gap-4">
                  {activeDeliveries.map((delivery) => (
                    <div key={delivery._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold">
                              Order #{delivery.orderId?.orderNumber}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(delivery.status)}`}>
                              {delivery.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Fee: <span className="font-bold text-green-600">${delivery.deliveryFee}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Customer</h4>
                          <p className="text-sm">{delivery.customer.name}</p>
                          <p className="text-sm text-gray-600">{delivery.customer.phone}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Delivery Address</h4>
                          <p className="text-sm">{delivery.customer.address.street}</p>
                          <p className="text-sm text-gray-600">
                            {delivery.customer.address.city}, {delivery.customer.address.state}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setShowStatusModal(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Update Status
                        </button>
                        {(delivery.status === 'in_transit' || delivery.status === 'out_for_delivery') && (
                          <button
                            onClick={() => {
                              setSelectedDelivery(delivery);
                              setShowProofModal(true);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="p-6">
              {deliveryHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No delivery history
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Order</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Customer</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Fee</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {deliveryHistory.map((delivery) => (
                        <tr key={delivery._id}>
                          <td className="px-4 py-2 text-sm">{delivery.orderId?.orderNumber}</td>
                          <td className="px-4 py-2 text-sm">{delivery.customer.name}</td>
                          <td className="px-4 py-2 text-sm font-bold text-green-600">
                            ${delivery.deliveryFee}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(delivery.status)}`}>
                              {delivery.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {new Date(delivery.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Update Delivery Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({...statusUpdate, status: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select status...</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate({...statusUpdate, notes: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  placeholder="Add any notes..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedDelivery(null);
                    resetStatusUpdate();
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof of Delivery Modal */}
      {showProofModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Delivery</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Received By *
                </label>
                <input
                  type="text"
                  value={proofOfDelivery.receivedBy}
                  onChange={(e) => setProofOfDelivery({...proofOfDelivery, receivedBy: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Name of person who received"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Notes
                </label>
                <textarea
                  value={proofOfDelivery.notes}
                  onChange={(e) => setProofOfDelivery({...proofOfDelivery, notes: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  placeholder="Any additional notes..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowProofModal(false);
                    setSelectedDelivery(null);
                    resetProofOfDelivery();
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteDelivery}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Confirm Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryProviderDashboard;
