import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrderById } from '../services/api';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import SEO from '../components/SEO';
import { 
  FiPackage, 
  FiTruck, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock,
  FiMapPin,
  FiCreditCard,
  FiShoppingBag,
  FiArrowLeft
} from 'react-icons/fi';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format price with thousand separators
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderById(id);
      setOrder(data);
    } catch (err) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        icon: <FiClock className="w-6 h-6" />,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Pending',
        description: 'Your order has been received and is awaiting processing'
      },
      processing: {
        icon: <FiPackage className="w-6 h-6" />,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'Processing',
        description: 'Your order is being prepared'
      },
      shipped: {
        icon: <FiTruck className="w-6 h-6" />,
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        label: 'Shipped',
        description: 'Your order is on its way'
      },
      delivered: {
        icon: <FiCheckCircle className="w-6 h-6" />,
        color: 'bg-green-100 text-green-800 border-green-200',
        label: 'Delivered',
        description: 'Your order has been delivered successfully'
      },
      cancelled: {
        icon: <FiXCircle className="w-6 h-6" />,
        color: 'bg-red-100 text-red-800 border-red-200',
        label: 'Cancelled',
        description: 'This order has been cancelled'
      }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getOrderTimeline = () => {
    const timeline = [
      {
        status: 'pending',
        label: 'Order Placed',
        date: order?.createdAt,
        completed: true
      },
      {
        status: 'processing',
        label: 'Processing',
        date: order?.status === 'processing' || order?.status === 'shipped' || order?.status === 'delivered' ? order?.updatedAt : null,
        completed: ['processing', 'shipped', 'delivered'].includes(order?.status)
      },
      {
        status: 'shipped',
        label: order?.fulfillmentMethod === 'collection' ? 'Ready for Pickup' : 'Shipped',
        date: order?.status === 'shipped' || order?.status === 'delivered' ? order?.updatedAt : null,
        completed: ['shipped', 'delivered'].includes(order?.status)
      },
      {
        status: 'delivered',
        label: order?.fulfillmentMethod === 'collection' ? 'Collected' : 'Delivered',
        date: order?.deliveredAt,
        completed: order?.status === 'delivered'
      }
    ];
    return timeline;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert 
            type="error" 
            message={error || 'Order not found'} 
            onClose={() => navigate('/orders')} 
          />
          <div className="mt-4">
            <Button onClick={() => navigate('/orders')} variant="outline">
              <FiArrowLeft className="mr-2" />
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO title={`Order #${order._id.slice(-8)}`} description="View your order details and tracking information." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button onClick={() => navigate('/orders')} variant="outline" className="mb-4">
            <FiArrowLeft className="mr-2" />
            Back to Orders
          </Button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600 mt-1">Order #{order._id.slice(-8)}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border-2 ${statusInfo.color}`}>
                {statusInfo.icon}
                <span className="font-semibold">{statusInfo.label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Status</h2>
              <p className="text-gray-600 mb-6">{statusInfo.description}</p>
              
              <div className="relative">
                {getOrderTimeline().map((item, index) => (
                  <div key={item.status} className="flex items-start mb-6 last:mb-0">
                    <div className="flex flex-col items-center mr-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                        ${item.completed ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                        {item.completed ? <FiCheckCircle className="w-5 h-5" /> : <FiClock className="w-5 h-5" />}
                      </div>
                      {index < getOrderTimeline().length - 1 && (
                        <div className={`w-0.5 h-12 mt-2 ${item.completed ? 'bg-blue-600' : 'bg-gray-300'}`} />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className={`font-semibold ${item.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                        {item.label}
                      </p>
                      {item.date && (
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(item.date)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.orderItems?.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 pb-4 border-b last:border-b-0 last:pb-0">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-semibold">
                          {item.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Price: R{formatPrice(item.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 tracking-tight">
                        R{formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Fulfillment Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FiMapPin className="mr-2" />
                {order.fulfillmentMethod === 'collection' ? 'Collection' : 'Delivery'} Information
              </h2>
              
              {order.fulfillmentMethod === 'collection' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 mb-2">Collection Address</p>
                  <p className="text-blue-800">
                    123 Main Street<br />
                    City Centre<br />
                    Business hours: Mon-Fri 9AM-5PM, Sat 9AM-2PM
                  </p>
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm text-blue-900 font-medium">Collection Instructions:</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Please bring your order confirmation and a valid ID when collecting your order.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Delivery Address</p>
                  <p className="text-gray-600">
                    {order.shippingAddress?.street}<br />
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br />
                    {order.shippingAddress?.country}
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>R{formatPrice(order.itemsPrice || 0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{order.fulfillmentMethod === 'collection' ? 'Collection' : 'Shipping'}</span>
                  <span>{order.shippingPrice === 0 ? 'FREE' : `R${formatPrice(order.shippingPrice || 0)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT (15%)</span>
                  <span>R{formatPrice(order.taxPrice || 0)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="tracking-tight">R{formatPrice(order.totalPrice || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-start">
                  <FiShoppingBag className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Fulfillment</p>
                    <p className="text-sm text-gray-600 capitalize">{order.fulfillmentMethod || 'Delivery'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FiCreditCard className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Payment Method</p>
                    <p className="text-sm text-gray-600 capitalize">{order.paymentMethod}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FiClock className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Order Date</p>
                    <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Status */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Status</h2>
              
              <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg border ${
                order.isPaid 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}>
                {order.isPaid ? (
                  <>
                    <FiCheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Paid</span>
                  </>
                ) : (
                  <>
                    <FiClock className="w-5 h-5" />
                    <span className="font-semibold">Pending Payment</span>
                  </>
                )}
              </div>

              {order.isPaid && order.paidAt && (
                <p className="text-sm text-gray-600 mt-3">
                  Paid on {formatDate(order.paidAt)}
                </p>
              )}
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Need Help?</h2>
              <div className="space-y-3">
                <Button variant="outline" fullWidth>
                  Contact Support
                </Button>
                {order.status === 'pending' && (
                  <Button variant="outline" fullWidth className="text-red-600 hover:text-red-700 hover:border-red-600">
                    Cancel Order
                  </Button>
                )}
                {order.status === 'delivered' && (
                  <Button fullWidth>
                    Write a Review
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
