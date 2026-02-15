import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const AdminDeliveryManagement = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('providers');
  const [providers, setProviders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [providerFilter, setProviderFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  
  // Assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  
  // Bulk assignment modal for provider selection
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  
  // Create delivery modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderSelection, setShowOrderSelection] = useState(true);
  const [newDelivery, setNewDelivery] = useState({
    orderId: '',
    customer: {
      name: '',
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        landmark: ''
      }
    },
    pickupAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    packageDetails: {
      description: '',
      weight: '',
      value: ''
    },
    deliveryFee: '',
    priority: 'normal'
  });

  useEffect(() => {
    fetchStatistics();
    if (activeTab === 'providers') {
      fetchProviders();
    } else if (activeTab === 'deliveries') {
      fetchDeliveries();
    } else if (activeTab === 'issue') {
      fetchAvailableProviders();
    }
  }, [activeTab, providerFilter, deliveryFilter]);

  useEffect(() => {
    if (showCreateModal && selectedProviderId) {
      fetchPendingOrders();
    }
  }, [showCreateModal, selectedProviderId]);

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/delivery/admin/statistics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatistics(response.data.statistics);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = providerFilter !== 'all' ? { status: providerFilter } : {};
      const response = await api.get('/delivery/admin/providers', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setProviders(response.data.providers);
    } catch (err) {
      setError('Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const params = deliveryFilter !== 'all' ? { status: deliveryFilter } : {};
      const response = await api.get('/delivery/admin/jobs', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setDeliveries(response.data.deliveries);
    } catch (err) {
      setError('Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProviders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/delivery/admin/providers', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'approved', availability: 'available' }
      });
      setAvailableProviders(response.data.providers);
    } catch (err) {
      setError('Failed to fetch available providers');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    setLoading(true);
    try {
      console.log('Fetching shipped orders for delivery...');
      // Fetch orders that are shipped and awaiting delivery
      const response = await api.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'shipped' }
      });
      console.log('API Response:', response.data);
      console.log('Total orders received:', response.data?.length || 0);
      
      // Filter for delivery orders only (not collection)
      const deliveryOrders = (response.data || []).filter(
        order => order.fulfillmentMethod === 'delivery'
      );
      console.log('Delivery orders after filtering:', deliveryOrders.length);
      setPendingOrders(deliveryOrders);
    } catch (err) {
      console.error('Failed to fetch pending orders:', err);
      setPendingOrders([]);
      setError('Failed to fetch pending orders');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingJobs = async () => {
    try {
      const response = await api.get('/delivery/admin/jobs', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'pending' }
      });
      setPendingJobs(response.data.deliveries || []);
    } catch (err) {
      console.error('Failed to fetch pending jobs:', err);
      setPendingJobs([]);
    }
  };

  const handleProviderStatusUpdate = async (providerId, status, reason = '') => {
    try {
      await api.put(`/delivery/admin/providers/${providerId}/status`, 
        { status, rejectedReason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Provider ${status} successfully`);
      fetchProviders();
      fetchStatistics();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update provider status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/delivery/admin/jobs', newDelivery, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const createdDelivery = response.data.delivery;
      
      // If a provider is pre-selected, auto-assign the job
      if (selectedProviderId) {
        await api.put(`/delivery/admin/jobs/${createdDelivery._id}/assign`,
          { providerId: selectedProviderId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('Delivery job created and assigned successfully');
      } else {
        setSuccess('Delivery job created successfully');
      }
      
      setShowCreateModal(false);
      fetchDeliveries();
      fetchStatistics();
      fetchAvailableProviders();
      resetNewDeliveryForm();
      setSelectedProviderId('');
      setPendingOrders([]); // Clear orders after successful creation
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create delivery job');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAssignDelivery = async () => {
    if (!selectedProviderId) {
      setError('Please select a provider');
      return;
    }
    
    try {
      await api.put(`/delivery/admin/jobs/${selectedDelivery._id}/assign`,
        { providerId: selectedProviderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Delivery assigned successfully');
      setShowAssignModal(false);
      setSelectedDelivery(null);
      setSelectedProviderId('');
      fetchDeliveries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign delivery');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBulkAssignJob = async () => {
    if (!selectedJobId) {
      setError('Please select a delivery job');
      return;
    }
    
    try {
      await api.put(`/delivery/admin/jobs/${selectedJobId}/assign`,
        { providerId: selectedProviderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Job assigned to provider successfully');
      setShowBulkAssignModal(false);
      setSelectedJobId('');
      setSelectedProviderId('');
      fetchDeliveries();
      fetchStatistics();
      fetchAvailableProviders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign job');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleProviderSelect = async (providerId) => {
    setSelectedProviderId(providerId);
    setLoading(true);
    try {
      await fetchPendingJobs();
      setShowBulkAssignModal(true);
    } catch (err) {
      setError('Failed to fetch pending jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJobForProvider = async (providerId) => {
    setSelectedProviderId(providerId);
    resetNewDeliveryForm();
    setShowOrderSelection(true);
    setShowCreateModal(true);
    // Fetch pending orders immediately when opening modal for a provider
    await fetchPendingOrders();
  };

  const handleOrderSelection = (order) => {
    setSelectedOrder(order);
    setNewDelivery({
      orderId: order._id,
      customer: {
        name: order.user?.name || order.shippingAddress?.fullName || '',
        phone: order.shippingAddress?.phone || '',
        email: order.user?.email || '',
        address: {
          street: order.shippingAddress?.address || '',
          city: order.shippingAddress?.city || '',
          state: order.shippingAddress?.state || '',
          zipCode: order.shippingAddress?.postalCode || '',
          landmark: order.shippingAddress?.landmark || ''
        }
      },
      pickupAddress: {
        street: '123 Warehouse St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      },
      packageDetails: {
        description: order.orderItems?.map(item => item.name).join(', ') || '',
        weight: '',
        value: order.totalPrice || 0
      },
      deliveryFee: '10.00',
      priority: 'normal'
    });
    setShowOrderSelection(false);
  };

  const resetNewDeliveryForm = () => {
    setNewDelivery({
      orderId: '',
      customer: {
        name: '',
        phone: '',
        email: '',
        address: { street: '', city: '', state: '', zipCode: '', landmark: '' }
      },
      pickupAddress: { street: '', city: '', state: '', zipCode: '' },
      packageDetails: { description: '', weight: '', value: '' },
      deliveryFee: '',
      priority: 'normal'
    });
    setSelectedOrder(null);
    setShowOrderSelection(true);
    // Don't clear pendingOrders here - it will be fetched by useEffect
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      accepted: 'bg-cyan-100 text-cyan-800',
      picked_up: 'bg-purple-100 text-purple-800',
      in_transit: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadgeClass = (priority) => {
    const priorityClasses = {
      low: 'bg-gray-100 text-gray-600',
      normal: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600'
    };
    return priorityClasses[priority] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="admin-page-title mb-6">Delivery Management</h1>

      {/* Alerts */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Statistics Dashboard */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Providers</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.providers.total}</p>
            <p className="text-sm text-green-600 mt-1">
              {statistics.providers.active} active
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Pending Approvals</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {statistics.providers.pendingApprovals}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Deliveries</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.deliveries.total}</p>
            <p className="text-sm text-blue-600 mt-1">
              {statistics.deliveries.inTransit} in transit
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Completion Rate</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {statistics.deliveries.completionRate}%
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {statistics.deliveries.completed} completed
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('providers')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'providers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Delivery Providers
            </button>
            <button
              onClick={() => setActiveTab('deliveries')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'deliveries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Delivery Jobs
            </button>
            <button
              onClick={() => setActiveTab('issue')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'issue'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Issue Jobs
            </button>
          </nav>
        </div>

        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {providers.map((provider) => (
                      <tr key={provider._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                          <div className="text-sm text-gray-500">Rating: {provider.rating.toFixed(1)} ⭐</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{provider.email}</div>
                          <div className="text-sm text-gray-500">{provider.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{provider.vehicleType}</div>
                          <div className="text-sm text-gray-500">{provider.vehicleNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {provider.completedDeliveries}/{provider.totalDeliveries} completed
                          </div>
                          <div className="text-sm text-gray-500">
                            {provider.getSuccessRate ? provider.getSuccessRate() : '0'}% success
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(provider.status)}`}>
                            {provider.status}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">{provider.availability}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {provider.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleProviderStatusUpdate(provider._id, 'approved')}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Reason for rejection:');
                                  if (reason) handleProviderStatusUpdate(provider._id, 'rejected', reason);
                                }}
                                className="px-3 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {provider.status === 'approved' && (
                            <button
                              onClick={() => handleProviderStatusUpdate(provider._id, 'suspended')}
                              className="px-3 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                            >
                              Suspend
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {providers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No providers found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Deliveries Tab */}
        {activeTab === 'deliveries' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <select
                  value={deliveryFilter}
                  onChange={(e) => setDeliveryFilter(e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="accepted">Accepted</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create Delivery Job
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deliveries.map((delivery) => (
                      <tr key={delivery._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {delivery.orderId?.orderNumber || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            R{delivery.deliveryFee}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{delivery.customer.name}</div>
                          <div className="text-sm text-gray-500">{delivery.customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {delivery.deliveryProvider?.name || 'Unassigned'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {delivery.deliveryProvider?.phone || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(delivery.priority)}`}>
                            {delivery.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(delivery.status)}`}>
                            {delivery.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {delivery.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                setShowAssignModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Assign
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {deliveries.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No deliveries found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Issue Jobs Tab */}
        {activeTab === 'issue' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Available Service Providers</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create New Job
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : availableProviders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-lg font-medium">No available providers</p>
                <p className="text-sm mt-2">All providers are either offline, busy, or pending approval</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableProviders.map((provider) => (
                  <div key={provider._id} className="border rounded-lg p-4 hover:shadow-lg transition bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{provider.name}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-sm font-medium">{provider.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                        Available
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {provider.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {provider.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                        {provider.vehicleType} - {provider.vehicleNumber}
                      </div>
                    </div>

                    <div className="border-t pt-3 mb-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="font-semibold">{provider.totalDeliveries}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Completed</div>
                          <div className="font-semibold text-green-600">{provider.completedDeliveries}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Success</div>
                          <div className="font-semibold text-blue-600">
                            {provider.totalDeliveries > 0 
                              ? Math.round((provider.completedDeliveries / provider.totalDeliveries) * 100)
                              : 0}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleProviderSelect(provider._id)}
                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Assign Job
                      </button>
                      <button
                        onClick={() => handleCreateJobForProvider(provider._id)}
                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 4v16m8-8H4" />
                        </svg>
                        Create New
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Assign Delivery</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Provider
              </label>
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Choose a provider...</option>
                {providers
                  .filter(p => p.status === 'approved' && p.availability === 'available')
                  .map(provider => (
                    <option key={provider._id} value={provider._id}>
                      {provider.name} - {provider.vehicleType} ({provider.rating.toFixed(1)} ⭐)
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedDelivery(null);
                  setSelectedProviderId('');
                }}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDelivery}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Delivery Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {selectedProviderId ? 'Create & Issue Job' : 'Create Delivery Job'}
            </h3>
            {selectedProviderId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  ℹ️ This job will be automatically assigned to the selected provider. Select a shipped order ready for delivery.
                </p>
              </div>
            )}

            {/* Step 1: Order Selection (only when provider is selected) */}
            {selectedProviderId && showOrderSelection ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">Select Shipped Order for Delivery</h4>
                  <span className="text-sm text-gray-600">{pendingOrders.length} shipped order{pendingOrders.length !== 1 ? 's' : ''}</span>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading pending orders...</p>
                  </div>
                ) : pendingOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium">No pending orders</p>
                    <p className="text-sm mt-2">No shipped orders awaiting delivery assignment. Orders must be marked as "Shipped" in Order Management first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                    {pendingOrders.map((order) => (
                      <div
                        key={order._id}
                        onClick={() => handleOrderSelection(order)}
                        className="border rounded-lg p-4 hover:shadow-lg hover:border-blue-500 transition cursor-pointer bg-white relative"
                      >
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                            Ready for Delivery
                          </span>
                        </div>
                        <div className="flex justify-between items-start mb-2 pr-28">
                          <div>
                            <h5 className="font-semibold text-lg">Order #{order.orderNumber || order._id.slice(-6)}</h5>
                            <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-green-600">R{order.totalPrice?.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Customer</p>
                            <p className="font-medium">{order.user?.name || order.shippingAddress?.fullName}</p>
                            <p className="text-sm text-gray-600">{order.shippingAddress?.phone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                            <p className="text-sm">{order.shippingAddress?.address}</p>
                            <p className="text-sm text-gray-600">
                              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500 mb-1">Items ({order.orderItems?.length || 0})</p>
                          <p className="text-sm">
                            {order.orderItems?.slice(0, 3).map(item => item.name).join(', ')}
                            {order.orderItems?.length > 3 && ` +${order.orderItems.length - 3} more`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-4 border-t mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetNewDeliveryForm();
                      setSelectedProviderId('');
                      setPendingOrders([]); // Clear orders when closing
                    }}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Delivery Details Form */
              <form onSubmit={handleCreateDelivery} className="space-y-4">
                {selectedOrder && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-green-800">
                        ✓ Order #{selectedOrder.orderNumber || selectedOrder._id.slice(-6)} selected
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowOrderSelection(true);
                          setSelectedOrder(null);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Change Order
                      </button>
                    </div>
                  </div>
                )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order ID
                  </label>
                  <input
                    type="text"
                    value={newDelivery.orderId}
                    onChange={(e) => setNewDelivery({...newDelivery, orderId: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newDelivery.priority}
                    onChange={(e) => setNewDelivery({...newDelivery, priority: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={newDelivery.customer.name}
                    onChange={(e) => setNewDelivery({
                      ...newDelivery,
                      customer: {...newDelivery.customer, name: e.target.value}
                    })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newDelivery.customer.phone}
                    onChange={(e) => setNewDelivery({
                      ...newDelivery,
                      customer: {...newDelivery.customer, phone: e.target.value}
                    })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="Street"
                  value={newDelivery.customer.address.street}
                  onChange={(e) => setNewDelivery({
                    ...newDelivery,
                    customer: {
                      ...newDelivery.customer,
                      address: {...newDelivery.customer.address, street: e.target.value}
                    }
                  })}
                  className="w-full border rounded px-3 py-2 mb-2"
                  required
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={newDelivery.customer.address.city}
                    onChange={(e) => setNewDelivery({
                      ...newDelivery,
                      customer: {
                        ...newDelivery.customer,
                        address: {...newDelivery.customer.address, city: e.target.value}
                      }
                    })}
                    className="border rounded px-3 py-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={newDelivery.customer.address.state}
                    onChange={(e) => setNewDelivery({
                      ...newDelivery,
                      customer: {
                        ...newDelivery.customer,
                        address: {...newDelivery.customer.address, state: e.target.value}
                      }
                    })}
                    className="border rounded px-3 py-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Zip Code"
                    value={newDelivery.customer.address.zipCode}
                    onChange={(e) => setNewDelivery({
                      ...newDelivery,
                      customer: {
                        ...newDelivery.customer,
                        address: {...newDelivery.customer.address, zipCode: e.target.value}
                      }
                    })}
                    className="border rounded px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Description
                  </label>
                  <input
                    type="text"
                    value={newDelivery.packageDetails.description}
                    onChange={(e) => setNewDelivery({
                      ...newDelivery,
                      packageDetails: {...newDelivery.packageDetails, description: e.target.value}
                    })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Fee (R)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newDelivery.deliveryFee}
                    onChange={(e) => setNewDelivery({...newDelivery, deliveryFee: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetNewDeliveryForm();
                    setSelectedProviderId('');
                    setPendingOrders([]); // Clear orders when closing
                  }}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {selectedProviderId ? 'Create & Issue Job' : 'Create Job'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {/* Bulk Job Assignment Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Assign Pending Jobs</h3>
              <button
                onClick={() => {
                  setShowBulkAssignModal(false);
                  setSelectedJobId('');
                  setSelectedProviderId('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                ℹ️ Select a pending delivery job to assign to this provider
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading pending jobs...</p>
              </div>
            ) : pendingJobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">No Pending Jobs Available</p>
                <p className="text-sm mt-2">All delivery jobs have been assigned or there are no jobs waiting for assignment</p>
                <button
                  onClick={() => {
                    const currentProviderId = selectedProviderId;
                    setShowBulkAssignModal(false);
                    handleCreateJobForProvider(currentProviderId);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create New Job Instead
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Found {pendingJobs.length} pending job{pendingJobs.length !== 1 ? 's' : ''} waiting for assignment
                </div>
                
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {pendingJobs.map((job) => (
                    <div
                      key={job._id}
                      onClick={() => setSelectedJobId(job._id)}
                      className={`border rounded-lg p-4 cursor-pointer transition ${
                        selectedJobId === job._id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">
                              Order #{job.orderId?.orderNumber || job.orderId?.toString().slice(-6) || 'N/A'}
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getPriorityBadgeClass(job.priority)}`}>
                              {job.priority}
                            </span>
                            {selectedJobId === job._id && (
                              <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Created {new Date(job.createdAt).toLocaleDateString()} at {new Date(job.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">R{job.deliveryFee}</div>
                          <div className="text-xs text-gray-500">Delivery Fee</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium">Customer</p>
                          <p className="font-medium text-sm">{job.customer.name}</p>
                          <p className="text-sm text-gray-600">{job.customer.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium">Delivery Address</p>
                          <p className="text-sm">{job.customer.address.street}</p>
                          <p className="text-sm text-gray-600">
                            {job.customer.address.city}, {job.customer.address.state} {job.customer.address.zipCode}
                          </p>
                        </div>
                      </div>

                      {job.packageDetails?.description && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1 font-medium">Package Details</p>
                          <p className="text-sm text-gray-700">{job.packageDetails.description}</p>
                          {job.packageDetails.weight && (
                            <p className="text-xs text-gray-500 mt-1">Weight: {job.packageDetails.weight}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowBulkAssignModal(false);
                      setSelectedJobId('');
                      setSelectedProviderId('');
                    }}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const currentProviderId = selectedProviderId;
                      setShowBulkAssignModal(false);
                      handleCreateJobForProvider(currentProviderId);
                    }}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                  >
                    Create New Job Instead
                  </button>
                  <button
                    onClick={handleBulkAssignJob}
                    disabled={!selectedJobId}
                    className={`px-6 py-2 rounded ${
                      selectedJobId
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Assign Selected Job
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeliveryManagement;
