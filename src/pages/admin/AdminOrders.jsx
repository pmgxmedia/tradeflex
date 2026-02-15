import { useState, useEffect } from 'react';
import { 
  getAllOrders, 
  updateOrderStatus, 
  confirmCODPayment, 
  verifyEFTProof, 
  updateOrderToPaid,
  sendPaymentConfirmationEmail,
  exportOrderReceipt,
  exportAllOrdersCSV,
  exportPaidOrdersCSV
} from '../../services/api';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, orderId: null, newStatus: null, order: null });
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistoryModal, setCustomerHistoryModal] = useState(false);
  const [cancellationModal, setCancellationModal] = useState({ show: false, orderId: null, order: null });
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data || []);
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find(o => o._id === orderId);
    
    // Check if payment confirmation is required
    if ((newStatus === 'shipped' || newStatus === 'delivered') && !order.isPaid) {
      setConfirmModal({ 
        show: true, 
        orderId, 
        newStatus, 
        order,
        type: 'payment-required'
      });
      return;
    }
    
    // Show cancellation modal for cancelled status
    if (newStatus === 'cancelled') {
      setCancellationModal({ show: true, orderId, order });
      return;
    }
    
    // Show confirmation for delivery/collection approval
    if (newStatus === 'shipped' || newStatus === 'delivered') {
      setConfirmModal({ 
        show: true, 
        orderId, 
        newStatus, 
        order,
        type: 'confirm-fulfillment'
      });
      return;
    }
    
    // For other status changes, proceed directly
    await executeStatusChange(orderId, newStatus);
  };

  const createDeliveryJob = async (order) => {
    try {
      const deliveryJobData = {
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
          description: order.orderItems?.map(item => `${item.name} (x${item.qty})`).join(', ') || '',
          weight: '',
          value: order.totalPrice || 0
        },
        deliveryFee: order.shippingPrice || 10.00,
        priority: 'normal'
      };

      await api.post('/delivery/admin/jobs', deliveryJobData);
      return true;
    } catch (error) {
      console.error('Failed to create delivery job:', error);
      return false;
    }
  };

  const executeStatusChange = async (orderId, newStatus, cancellationData = {}) => {
    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus, cancellationData);
      setOrders(orders.map(o => o._id === orderId ? updatedOrder : o));
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      
      // Create delivery job if order is marked as shipped and fulfillment is delivery
      if (newStatus === 'shipped' && updatedOrder.fulfillmentMethod === 'delivery') {
        const deliveryCreated = await createDeliveryJob(updatedOrder);
        if (deliveryCreated) {
          setAlert({ 
            type: 'success', 
            message: 'Order status updated and delivery job created!' 
          });
        } else {
          setAlert({ 
            type: 'success', 
            message: 'Order status updated! (Note: Unable to create delivery job - please create manually)' 
          });
        }
      } else {
        setAlert({ type: 'success', message: 'Order status updated!' });
      }
      
      setConfirmModal({ show: false, orderId: null, newStatus: null, order: null });
      setCancellationModal({ show: false, orderId: null, order: null });
      setCancellationReason('');
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to update order status' });
      setConfirmModal({ show: false, orderId: null, newStatus: null, order: null });
      setCancellationModal({ show: false, orderId: null, order: null });
      // Force re-render to reset select dropdown
      setOrders([...orders]);
    }
  };

  const handleCancelWithReason = () => {
    if (!cancellationReason.trim()) {
      setAlert({ type: 'error', message: 'Please provide a reason for cancellation' });
      return;
    }
    executeStatusChange(cancellationModal.orderId, 'cancelled', {
      cancelledBy: 'admin',
      cancellationReason: cancellationReason
    });
  };

  const handleConfirmStatusChange = () => {
    executeStatusChange(confirmModal.orderId, confirmModal.newStatus);
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setActiveTab('payment-analysis');
  };

  const handleCODConfirmation = async (orderId, status) => {
    try {
      const updatedOrder = await confirmCODPayment(orderId, status);
      setOrders(orders.map(o => o._id === orderId ? updatedOrder : o));
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      setAlert({ 
        type: 'success', 
        message: `COD payment ${status === 'received' ? 'confirmed' : 'denied'} successfully!` 
      });
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to confirm COD payment' });
    }
  };

  const handleEFTVerification = async (orderId, verified) => {
    try {
      const updatedOrder = await verifyEFTProof(orderId, verified);
      setOrders(orders.map(o => o._id === orderId ? updatedOrder : o));
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      setAlert({ 
        type: 'success', 
        message: `EFT proof ${verified ? 'verified' : 'rejected'} successfully!` 
      });
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to verify EFT proof' });
    }
  };

  const handlePaymentStatusChange = async (orderId, newStatus) => {
    try {
      let updatedOrder;
      
      if (newStatus === 'paid') {
        // Mark as paid
        updatedOrder = await updateOrderToPaid(orderId, {
          id: `ADMIN_CONFIRM_${Date.now()}`,
          status: 'completed',
          update_time: new Date().toISOString(),
          email_address: 'admin@estore.com',
        });
      } else if (newStatus === 'denied') {
        // For denied payments, cancel the order
        updatedOrder = await updateOrderStatus(orderId, 'cancelled');
      }
      
      setOrders(orders.map(o => o._id === orderId ? updatedOrder : o));
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      setAlert({ 
        type: 'success', 
        message: `Payment ${newStatus === 'paid' ? 'confirmed' : 'denied'} successfully!` 
      });
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to update payment status' });
    }
  };

  const handleSendConfirmationEmail = async (orderId) => {
    try {
      const result = await sendPaymentConfirmationEmail(orderId);
      setAlert({ 
        type: 'success', 
        message: `Confirmation email sent to ${result.recipient}!` 
      });
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.message || 'Failed to send confirmation email' 
      });
    }
  };

  const handleExportReceipt = (orderId) => {
    try {
      exportOrderReceipt(orderId);
      setAlert({ 
        type: 'success', 
        message: 'Receipt download started!' 
      });
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: 'Failed to export receipt' 
      });
    }
  };

  const handleExportAllOrders = () => {
    try {
      exportAllOrdersCSV();
      setAlert({ 
        type: 'success', 
        message: 'All orders CSV download started!' 
      });
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: 'Failed to export orders' 
      });
    }
  };

  const handleExportPaidOrders = () => {
    try {
      exportPaidOrdersCSV();
      setAlert({ 
        type: 'success', 
        message: 'Paid orders CSV download started!' 
      });
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: 'Failed to export paid orders' 
      });
    }
  };

  // Calculate payment statistics
  const paymentStats = {
    totalOrders: orders.length,
    paidOrders: orders.filter(o => o.isPaid).length,
    unpaidOrders: orders.filter(o => !o.isPaid).length,
    totalRevenue: orders.filter(o => o.isPaid).reduce((sum, o) => sum + (o.totalPrice || 0), 0),
    pendingRevenue: orders.filter(o => !o.isPaid).reduce((sum, o) => sum + (o.totalPrice || 0), 0),
    paymentMethods: orders.reduce((acc, o) => {
      acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + 1;
      return acc;
    }, {}),
    statusBreakdown: orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {}),
  };

  // Calculate customer records
  const customerRecords = orders.reduce((acc, order) => {
    if (order.user && order.user._id) {
      const customerId = order.user._id;
      
      if (!acc[customerId]) {
        acc[customerId] = {
          _id: customerId,
          name: order.user.name || 'N/A',
          email: order.user.email || 'N/A',
          orders: [],
          totalOrders: 0,
          totalSpent: 0,
          totalPaid: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          firstOrderDate: order.createdAt,
          lastOrderDate: order.createdAt,
        };
      }
      
      acc[customerId].orders.push(order);
      acc[customerId].totalOrders++;
      acc[customerId].totalSpent += order.totalPrice || 0;
      
      if (order.isPaid) {
        acc[customerId].totalPaid += order.totalPrice || 0;
      }
      
      if (order.status === 'delivered') {
        acc[customerId].completedOrders++;
      }
      
      if (order.status === 'cancelled') {
        acc[customerId].cancelledOrders++;
      }
      
      // Update date range
      if (new Date(order.createdAt) < new Date(acc[customerId].firstOrderDate)) {
        acc[customerId].firstOrderDate = order.createdAt;
      }
      if (new Date(order.createdAt) > new Date(acc[customerId].lastOrderDate)) {
        acc[customerId].lastOrderDate = order.createdAt;
      }
    }
    
    return acc;
  }, {});

  const customerList = Object.values(customerRecords).sort((a, b) => 
    new Date(b.lastOrderDate) - new Date(a.lastOrderDate)
  );

  const handleViewCustomerHistory = (customer) => {
    setSelectedCustomer(customer);
    setCustomerHistoryModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="home-hero-heading text-3xl font-bold text-gray-900 mb-8">Order Management</h1>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Orders List
            </button>
            <button
              onClick={() => setActiveTab('payment-analysis')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'payment-analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Analysis
            </button>
            <button
              onClick={() => setActiveTab('customer-records')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'customer-records'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Customer Records
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                {customerList.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Orders List Tab */}
        {activeTab === 'orders' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className={`${order.status === 'delivered' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${order.status === 'delivered' ? 'text-gray-400' : 'text-gray-900'}`}>
                        #{order._id.slice(-8)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${order.status === 'delivered' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.user?.name || order.shippingAddress?.fullName || 'Guest'}</span>
                          {order.user?.email && (
                            <span className="text-xs text-gray-500">{order.user.email}</span>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${order.status === 'delivered' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${order.status === 'delivered' ? 'text-gray-400' : 'text-gray-900'}`}>
                        R{order.totalPrice?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                          ${order.status === 'delivered' 
                            ? 'bg-gray-200 text-gray-500'
                            : order.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {order.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          key={`${order._id}-${order.status}`}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          disabled={order.status === 'delivered'}
                          className={`text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${order.status === 'delivered' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          className={`font-medium ${order.status === 'delivered' ? 'text-gray-400 hover:text-gray-500' : 'text-blue-600 hover:text-blue-800'}`}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Payment Analysis Tab */}
        {activeTab === 'payment-analysis' && (
          <div className="space-y-6">
            {/* Export Buttons */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Export Options</h3>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleExportAllOrders}
                    className="px-3 sm:px-4 py-2 bg-blue-600 bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text rounded-md text-xs sm:text-sm font-bold hover:from-blue-700 hover:to-green-700 flex items-center justify-center border border-blue-600 whitespace-nowrap"
                  >
                    <svg className="h-4 w-4 sm:mr-2" fill="none" stroke="url(#gradient1)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{stopColor: '#2563eb', stopOpacity: 1}} />
                          <stop offset="100%" style={{stopColor: '#16a34a', stopOpacity: 1}} />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Export All Orders (CSV)</span>
                    <span className="inline sm:hidden ml-2">All Orders</span>
                  </button>
                  <button
                    onClick={handleExportPaidOrders}
                    className="px-3 sm:px-4 py-2 bg-green-600 bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text rounded-md text-xs sm:text-sm font-bold hover:from-blue-700 hover:to-green-700 flex items-center justify-center border border-green-600 whitespace-nowrap"
                  >
                    <svg className="h-4 w-4 sm:mr-2" fill="none" stroke="url(#gradient2)" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{stopColor: '#2563eb', stopOpacity: 1}} />
                          <stop offset="100%" style={{stopColor: '#16a34a', stopOpacity: 1}} />
                        </linearGradient>
                      </defs>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Export Paid Orders (CSV)</span>
                    <span className="inline sm:hidden ml-2">Paid Orders</span>
                  </button>
                </div>
              </div>
            </Card>

            {/* Payment Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{paymentStats.totalOrders}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Paid Orders</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{paymentStats.paidOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {paymentStats.totalOrders > 0 ? ((paymentStats.paidOrders / paymentStats.totalOrders) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unpaid Orders</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{paymentStats.unpaidOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {paymentStats.totalOrders > 0 ? ((paymentStats.unpaidOrders / paymentStats.totalOrders) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">R{paymentStats.totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Confirmed</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>

            {/* Payment Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                <div className="space-y-3">
                  {Object.entries(paymentStats.paymentMethods).map(([method, count]) => (
                    <div key={method} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{method}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(count / paymentStats.totalOrders) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
                <div className="space-y-3">
                  {Object.entries(paymentStats.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{status}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(count / paymentStats.totalOrders) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Pending Revenue Alert */}
            {paymentStats.pendingRevenue > 0 && (
              <Card className="p-6 bg-yellow-50 border border-yellow-200">
                <div className="flex items-start">
                  <svg className="h-6 w-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Pending Revenue</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      You have R{paymentStats.pendingRevenue.toFixed(2)} in pending payments across {paymentStats.unpaidOrders} orders.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Unpaid Orders Table */}
            {paymentStats.unpaidOrders > 0 && (
              <Card>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Unpaid Orders - Payment Confirmation Required</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Review and confirm payment for the following orders before approving delivery or collection.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.filter(o => !o.isPaid).map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order._id.slice(-8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {order.user?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            R{order.totalPrice?.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                            {order.paymentMethod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                              ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Selected Order Details for Payment Confirmation */}
            {selectedOrder && (
              <Card>
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Order Details & Payment Validation</h3>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order ID:</span>
                          <span className="font-medium text-gray-900">#{selectedOrder._id.slice(-8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Customer:</span>
                          <span className="font-medium text-gray-900">{selectedOrder.user?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium text-gray-900">{selectedOrder.user?.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order Date:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(selectedOrder.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fulfillment:</span>
                          <span className="font-medium text-gray-900 capitalize">{selectedOrder.fulfillmentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                            ${selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              selectedOrder.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              selectedOrder.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {selectedOrder.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-medium text-gray-900 capitalize">{selectedOrder.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Payment Status:</span>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                              ${selectedOrder.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {selectedOrder.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                            {!selectedOrder.isPaid && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handlePaymentStatusChange(selectedOrder._id, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                className="text-xs border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 py-1"
                                defaultValue=""
                              >
                                <option value="" disabled>Change Status</option>
                                <option value="paid">Mark as Paid</option>
                                <option value="denied">Deny Payment</option>
                              </select>
                            )}
                          </div>
                        </div>
                        {selectedOrder.isPaid && selectedOrder.paidAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Paid At:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(selectedOrder.paidAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-gray-600">Items Price:</span>
                          <span className="font-medium text-gray-900">R{selectedOrder.itemsPrice?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">VAT (15%):</span>
                          <span className="font-medium text-gray-900">R{selectedOrder.taxPrice?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping:</span>
                          <span className="font-medium text-gray-900">R{selectedOrder.shippingPrice?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t font-semibold">
                          <span className="text-gray-900">Total:</span>
                          <span className="text-gray-900">R{selectedOrder.totalPrice?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Validation Alert */}
                  {!selectedOrder.isPaid && selectedOrder.paymentMethod === 'cod' && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium text-blue-800">Cash on Delivery (COD) Payment</h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>This order uses Cash on Delivery payment method. Confirm payment receipt after delivery/collection.</p>
                            {selectedOrder.codPaymentStatus && selectedOrder.codPaymentStatus !== 'pending' && (
                              <div className="mt-3 p-2 bg-white rounded border border-blue-300">
                                <p className="font-medium">
                                  Status: <span className={`${selectedOrder.codPaymentStatus === 'received' ? 'text-green-600' : 'text-red-600'}`}>
                                    {selectedOrder.codPaymentStatus.toUpperCase()}
                                  </span>
                                </p>
                                {selectedOrder.codConfirmedAt && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    Confirmed at: {new Date(selectedOrder.codConfirmedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          {selectedOrder.codPaymentStatus === 'pending' && (
                            <div className="mt-4 flex space-x-3">
                              <button
                                onClick={() => handleCODConfirmation(selectedOrder._id, 'received')}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text font-bold border-2 border-green-600 rounded-md text-sm hover:from-blue-700 hover:to-green-700 hover:border-green-700 flex items-center"
                              >
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Confirm Received
                              </button>
                              <button
                                onClick={() => handleCODConfirmation(selectedOrder._id, 'denied')}
                                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 flex items-center"
                              >
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Deny Payment
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!selectedOrder.isPaid && selectedOrder.paymentMethod === 'eft' && (
                    <div className="mt-6 bg-purple-50 border border-purple-200 rounded-md p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium text-purple-800">EFT Payment - Proof Required</h3>
                          <div className="mt-2 text-sm text-purple-700">
                            <p>This order uses EFT payment. Customer must upload proof of payment for verification.</p>
                            
                            {selectedOrder.paymentProof && selectedOrder.paymentProof.url ? (
                              <div className="mt-3 space-y-3">
                                <div className="p-3 bg-white rounded border border-purple-300">
                                  <p className="font-medium text-gray-900 mb-2">Proof of Payment Uploaded</p>
                                  <div className="flex items-center justify-between">
                                    <a 
                                      href={selectedOrder.paymentProof.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                    >
                                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      View Proof
                                    </a>
                                    <span className="text-xs text-gray-500">
                                      Uploaded: {new Date(selectedOrder.paymentProof.uploadedAt).toLocaleString()}
                                    </span>
                                  </div>
                                  {selectedOrder.paymentProof.verified && (
                                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                      <p className="text-sm text-green-800 font-medium">✓ Verified</p>
                                      {selectedOrder.paymentProof.verifiedAt && (
                                        <p className="text-xs text-green-700">
                                          At: {new Date(selectedOrder.paymentProof.verifiedAt).toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {!selectedOrder.paymentProof.verified && (
                                  <div className="flex space-x-3">
                                    <button
                                      onClick={() => handleEFTVerification(selectedOrder._id, true)}
                                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text font-bold border-2 border-green-600 rounded-md text-sm hover:from-blue-700 hover:to-green-700 hover:border-green-700 flex items-center"
                                    >
                                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Verify & Approve
                                    </button>
                                    <button
                                      onClick={() => handleEFTVerification(selectedOrder._id, false)}
                                      className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 flex items-center"
                                    >
                                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="mt-3 p-3 bg-white rounded border border-purple-300">
                                <p className="text-sm text-gray-700">⏳ Waiting for customer to upload proof of payment</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!selectedOrder.isPaid && selectedOrder.paymentMethod !== 'cod' && selectedOrder.paymentMethod !== 'eft' && (
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Payment Confirmation Required</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>This order has not been marked as paid. Before you can approve delivery or mark as shipped, you must:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Verify payment receipt through your payment processor</li>
                              <li>Confirm the payment amount matches R{selectedOrder.totalPrice?.toFixed(2)}</li>
                              <li>Check for any payment method specific requirements</li>
                            </ul>
                            <p className="mt-3 font-medium">
                              The system will prevent status changes to "shipped" or "delivered" until payment is confirmed.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedOrder.isPaid && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-green-800">Payment Confirmed</h3>
                              <p className="text-sm text-green-700 mt-1">
                                Payment has been verified and confirmed. This order can be processed for {selectedOrder.fulfillmentMethod}.
                              </p>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => handleExportReceipt(selectedOrder._id)}
                                className="px-3 py-2 bg-white border border-green-600 text-green-700 rounded-md text-sm font-medium hover:bg-green-50 flex items-center"
                                title="Download Receipt"
                              >
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Receipt
                              </button>
                              <button
                                onClick={() => handleSendConfirmationEmail(selectedOrder._id)}
                                className="px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
                                title="Send Email Confirmation"
                              >
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Send Confirmation
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === 'cancelled' && selectedOrder.cancellation && (
                    <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Order Cancelled</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p className="font-semibold">
                              Cancelled by: {selectedOrder.cancellation.cancelledBy === 'admin' ? 'Admin' : 'Customer'}
                            </p>
                            {selectedOrder.cancellation.cancelledAt && (
                              <p className="mt-1">
                                Cancelled on: {new Date(selectedOrder.cancellation.cancelledAt).toLocaleString()}
                              </p>
                            )}
                            <div className="mt-2 bg-white rounded p-3 border border-red-300">
                              <p className="font-semibold text-red-900">Reason:</p>
                              <p className="mt-1 text-red-800">{selectedOrder.cancellation.reason || 'No reason provided'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h4>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedOrder.orderItems?.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3">{item.name}</td>
                              <td className="px-4 py-3">{item.quantity}</td>
                              <td className="px-4 py-3">R{item.price?.toFixed(2)}</td>
                              <td className="px-4 py-3">R{(item.price * item.quantity)?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('orders');
                        setSelectedOrder(null);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text font-bold border-2 border-blue-600 rounded-md text-sm hover:from-blue-700 hover:to-green-700 hover:border-blue-700"
                    >
                      Go to Orders List
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Customer Records Tab */}
        {activeTab === 'customer-records' && (
          <div className="space-y-6">
            {/* Customer Records Header */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Customer Records</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Permanent records of all customers who have placed orders
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{customerList.length}</div>
                  <div className="text-sm text-gray-600">Total Customers</div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Total Orders</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {customerList.reduce((sum, c) => sum + c.totalOrders, 0)}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Total Revenue</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    R{customerList.reduce((sum, c) => sum + c.totalPaid, 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Avg Order Value</div>
                  <div className="text-2xl font-bold text-purple-900 mt-1">
                    R{customerList.length > 0 
                      ? (customerList.reduce((sum, c) => sum + c.totalPaid, 0) / customerList.reduce((sum, c) => sum + c.totalOrders, 0)).toFixed(2)
                      : '0.00'}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-orange-600 font-medium">Completed Orders</div>
                  <div className="text-2xl font-bold text-orange-900 mt-1">
                    {customerList.reduce((sum, c) => sum + c.completedOrders, 0)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Customer List */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cancelled</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerList.length > 0 ? (
                      customerList.map((customer) => (
                        <tr key={customer._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                              <span className="text-xs text-gray-500">{customer.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {customer.totalOrders}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            R{customer.totalSpent.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                            R{customer.totalPaid.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {customer.completedOrders}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {customer.cancelledOrders > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {customer.cancelledOrders}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(customer.lastOrderDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleViewCustomerHistory(customer)}
                              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                            >
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View History
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-lg font-medium">No customer records yet</p>
                            <p className="text-sm mt-1">Customer records will appear here once orders are placed</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Customer History Modal */}
      <Modal
        isOpen={customerHistoryModal}
        onClose={() => {
          setCustomerHistoryModal(false);
          setSelectedCustomer(null);
        }}
        title="Customer Purchase History"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedCustomer.email}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-700">
                        Customer since: {new Date(selectedCustomer.firstOrderDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{selectedCustomer.totalOrders}</div>
                  <div className="text-xs text-gray-600">Total Orders</div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-200">
                <div>
                  <div className="text-xs text-gray-600">Total Spent</div>
                  <div className="text-lg font-bold text-gray-900">R{selectedCustomer.totalSpent.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Total Paid</div>
                  <div className="text-lg font-bold text-green-600">R{selectedCustomer.totalPaid.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Completed</div>
                  <div className="text-lg font-bold text-blue-600">{selectedCustomer.completedOrders}</div>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Order History ({selectedCustomer.orders.length})</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedCustomer.orders
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((order) => (
                    <div key={order._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold text-gray-900">#{order._id.slice(-8)}</span>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                              ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'}`}>
                              {order.status}
                            </span>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                              ${order.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {order.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-4">
                              <span>📅 {new Date(order.createdAt).toLocaleDateString()}</span>
                              <span>💳 {order.paymentMethod.toUpperCase()}</span>
                              <span>📦 {order.fulfillmentMethod === 'delivery' ? 'Delivery' : 'Collection'}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="text-xs text-gray-500">Items:</div>
                            <div className="text-sm text-gray-700">
                              {order.orderItems.map((item, idx) => (
                                <span key={idx}>
                                  {item.name} (×{item.quantity})
                                  {idx < order.orderItems.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                          {order.status === 'cancelled' && order.cancellation && (
                            <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                              <div className="flex items-start">
                                <svg className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div className="flex-1">
                                  <div className="text-xs font-semibold text-red-800 mb-1">
                                    Cancelled by: {order.cancellation.cancelledBy === 'admin' ? 'Admin' : 'Customer'}
                                    {order.cancellation.cancelledAt && (
                                      <span className="ml-2 font-normal">
                                        ({new Date(order.cancellation.cancelledAt).toLocaleDateString()})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-red-700">
                                    <strong>Reason:</strong> {order.cancellation.reason || 'No reason provided'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-bold text-gray-900">R{order.totalPrice.toFixed(2)}</div>
                          {order.isPaid && order.paidAt && (
                            <div className="text-xs text-green-600 mt-1">
                              Paid: {new Date(order.paidAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => {
                  setCustomerHistoryModal(false);
                  setSelectedCustomer(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-transparent bg-clip-text font-bold border-2 border-red-600 rounded-md text-sm hover:from-red-700 hover:to-orange-700 hover:border-red-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal({ show: false, orderId: null, newStatus: null, order: null })}
        title={confirmModal.type === 'payment-required' ? 'Payment Required' : 'Confirm Order Fulfillment'}
      >
        <div className="space-y-4">
          {confirmModal.type === 'payment-required' ? (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Payment Not Confirmed</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>This order has not been paid yet. Payment must be confirmed before you can approve delivery or collection.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-md p-4">
                <div className="text-sm space-y-2">
                  <p><strong>Order ID:</strong> #{confirmModal.order?._id.slice(-8)}</p>
                  <p><strong>Customer:</strong> {confirmModal.order?.user?.name}</p>
                  <p><strong>Total:</strong> R{confirmModal.order?.totalPrice?.toFixed(2)}</p>
                  <p><strong>Payment Status:</strong> <span className="text-red-600 font-semibold">Unpaid</span></p>
                  <p><strong>Fulfillment:</strong> {confirmModal.order?.fulfillmentMethod === 'delivery' ? 'Delivery' : 'Collection'}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Please confirm payment receipt before proceeding with {confirmModal.order?.fulfillmentMethod === 'delivery' ? 'delivery' : 'collection'} approval.
              </p>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setConfirmModal({ show: false, orderId: null, newStatus: null, order: null })}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Confirm Order Fulfillment</h3>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-md p-4">
                <div className="text-sm space-y-2">
                  <p><strong>Order ID:</strong> #{confirmModal.order?._id.slice(-8)}</p>
                  <p><strong>Customer:</strong> {confirmModal.order?.user?.name}</p>
                  <p><strong>Total:</strong> R{confirmModal.order?.totalPrice?.toFixed(2)}</p>
                  <p><strong>Payment Status:</strong> <span className="text-green-600 font-semibold">Paid</span></p>
                  <p><strong>Fulfillment:</strong> {confirmModal.order?.fulfillmentMethod === 'delivery' ? 'Delivery' : 'Collection'}</p>
                  {confirmModal.newStatus === 'shipped' && (
                    <p><strong>Action:</strong> Mark as ready for {confirmModal.order?.fulfillmentMethod === 'delivery' ? 'delivery' : 'collection'}</p>
                  )}
                  {confirmModal.newStatus === 'delivered' && (
                    <p><strong>Action:</strong> Mark as {confirmModal.order?.fulfillmentMethod === 'delivery' ? 'delivered' : 'collected'}</p>
                  )}
                </div>
              </div>
              {confirmModal.newStatus === 'shipped' && confirmModal.order?.fulfillmentMethod === 'delivery' && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-800">
                        <strong>Automatic Delivery Job Creation:</strong> A delivery job will be automatically created in the delivery management system for this order.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-600">
                {confirmModal.newStatus === 'shipped' && `Are you sure you want to mark this order as ready for ${confirmModal.order?.fulfillmentMethod === 'delivery' ? 'delivery' : 'collection'}?`}
                {confirmModal.newStatus === 'delivered' && `Are you sure you want to mark this order as ${confirmModal.order?.fulfillmentMethod === 'delivery' ? 'delivered' : 'collected'}?`}
              </p>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setConfirmModal({ show: false, orderId: null, newStatus: null, order: null })}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  className="px-4 py-2 border-2 border-blue-600 rounded-md shadow-sm text-sm bg-gradient-to-r from-blue-600 to-green-600 text-transparent bg-clip-text font-bold hover:from-blue-700 hover:to-green-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Confirm
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancellationModal.show}
        onClose={() => {
          setCancellationModal({ show: false, orderId: null, order: null });
          setCancellationReason('');
        }}
        title="Cancel Order - Admin"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Cancel Order</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>You are about to cancel this order. This action will be recorded as an admin cancellation.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-md p-4">
            <div className="text-sm space-y-2">
              <p><strong>Order ID:</strong> #{cancellationModal.order?._id.slice(-8)}</p>
              <p><strong>Customer:</strong> {cancellationModal.order?.user?.name}</p>
              <p><strong>Total:</strong> R{cancellationModal.order?.totalPrice?.toFixed(2)}</p>
              <p><strong>Payment Status:</strong> <span className={cancellationModal.order?.isPaid ? 'text-green-600' : 'text-red-600'}>{cancellationModal.order?.isPaid ? 'Paid' : 'Unpaid'}</span></p>
            </div>
          </div>

          <div>
            <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <textarea
              id="cancellationReason"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please provide a detailed reason for cancelling this order..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              This reason will be visible to the customer and recorded permanently.
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setCancellationModal({ show: false, orderId: null, order: null });
                setCancellationReason('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Go Back
            </button>
            <button
              onClick={handleCancelWithReason}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 flex items-center"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminOrders;
