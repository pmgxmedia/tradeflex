import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import SEO from '../components/SEO';
import { FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiArrowLeft } from 'react-icons/fi';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format price with thousand separators
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getMyOrders();
      setOrders(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiPackage className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <FiPackage className="w-5 h-5 text-blue-500" />;
      case 'shipped':
        return <FiTruck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <FiXCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FiPackage className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      <SEO title="My Orders" description="View and track your order history." canonicalPath="/orders" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button onClick={() => navigate('/')} variant="outline" className="mb-4">
            <FiArrowLeft className="mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <FiPackage className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here!</p>
            <Link
              to="/products"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order._id} className="overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Order ID</p>
                          <p className="font-semibold text-gray-900">#{order._id.slice(-8)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Date</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="font-semibold text-gray-900 tracking-tight">
                            R{formatPrice(order.totalPrice || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-semibold text-gray-900 capitalize">
                            {order.fulfillmentMethod || 'Delivery'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center space-x-3">
                      <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </span>
                      {order.isPaid && (
                        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.orderItems?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                              {item.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 tracking-tight">
                            R{formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Fulfillment Address */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {order.fulfillmentMethod === 'collection' ? 'Collection' : 'Delivery'} Address
                    </h4>
                    {order.fulfillmentMethod === 'collection' ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-900 text-sm font-medium mb-1">Store Pickup</p>
                        <p className="text-blue-800 text-sm">
                          123 Main Street<br />
                          City Centre<br />
                          Mon-Fri 9AM-5PM, Sat 9AM-2PM
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">
                        {order.shippingAddress?.street}<br />
                        {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br />
                        {order.shippingAddress?.country}
                      </p>
                    )}
                  </div>

                  {/* Payment Information */}
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Payment Method</p>
                      <p className="font-medium text-gray-900 capitalize">{order.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Items</p>
                      <p className="font-medium text-gray-900">{order.orderItems?.length || 0} item(s)</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex space-x-4">
                    <Link
                      to={`/order/${order._id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      View Details
                    </Link>
                    {order.status === 'delivered' && (
                      <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                        Write a Review
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
