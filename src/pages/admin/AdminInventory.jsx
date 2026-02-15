import { useState, useEffect, useRef } from 'react';
import { getProducts } from '../../services/api';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { FiPackage, FiAlertTriangle, FiTrendingUp, FiBox, FiActivity, FiRefreshCw } from 'react-icons/fi';
import io from 'socket.io-client';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, low, out
  const [realtimeMetrics, setRealtimeMetrics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket server for real-time updates
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('✓ Connected to real-time inventory monitoring');
      setIsConnected(true);
    });

    socketRef.current.on('inventoryStats', (data) => {
      setProducts(data.products || []);
      setRealtimeMetrics(data.metrics);
      setRecentActivity(data.recentActivity || []);
      setLastUpdate(new Date(data.timestamp));
      setLoading(false);
    });

    socketRef.current.on('inventoryError', (error) => {
      console.error('Inventory monitoring error:', error);
    });

    socketRef.current.on('disconnect', () => {
      console.log('✗ Disconnected from real-time inventory monitoring');
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchInventory = async () => {
    // Manual refresh via socket
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('refreshInventory');
    }
  };

  // Use real-time metrics if available, otherwise calculate from products
  const lowStockProducts = realtimeMetrics?.lowStockProducts || 
    products.filter(p => p.countInStock > 0 && p.countInStock < 10);
  const outOfStockProducts = realtimeMetrics?.outOfStockProducts || 
    products.filter(p => p.countInStock === 0);
  const totalValue = realtimeMetrics?.totalValue || 
    products.reduce((sum, p) => sum + (p.price * p.countInStock), 0);

  const filteredProducts = products.filter(product => {
    if (filter === 'low') return product.countInStock > 0 && product.countInStock < 10;
    if (filter === 'out') return product.countInStock === 0;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="home-hero-heading text-2xl font-bold text-gray-900">Inventory Management</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-600">Real-time stock monitoring</p>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                {isConnected ? 'Live' : 'Offline'}
              </div>
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  Updated {new Date(lastUpdate).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={fetchInventory}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 transition-all hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                Total Products
                {isConnected && <FiActivity className="w-3 h-3 text-green-500 animate-pulse" />}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {realtimeMetrics?.totalProducts ?? products.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiBox className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 transition-all hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                Low Stock
                {isConnected && lowStockProducts.length > 0 && (
                  <FiActivity className="w-3 h-3 text-yellow-500 animate-pulse" />
                )}
              </p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {realtimeMetrics?.lowStock ?? lowStockProducts.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiAlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 transition-all hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                Out of Stock
                {isConnected && outOfStockProducts.length > 0 && (
                  <FiActivity className="w-3 h-3 text-red-500 animate-pulse" />
                )}
              </p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {realtimeMetrics?.outOfStock ?? outOfStockProducts.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FiPackage className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 transition-all hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                Inventory Value
                {isConnected && <FiActivity className="w-3 h-3 text-green-500 animate-pulse" />}
              </p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                R{typeof totalValue === 'number' ? totalValue.toFixed(0) : totalValue}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Products ({products.length})
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === 'low'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Low Stock ({lowStockProducts.length})
            </button>
            <button
              onClick={() => setFilter('out')}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === 'out'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Out of Stock ({outOfStockProducts.length})
            </button>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiActivity className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            {isConnected && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={activity.id || index} className="text-xs border-l-2 border-blue-200 pl-2 py-1">
                  <p className="font-medium text-gray-800">{activity.customer}</p>
                  <p className="text-gray-600">{activity.items} items · R{activity.total.toFixed(2)}</p>
                  <p className="text-gray-400">{new Date(activity.createdAt).toLocaleTimeString()}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Product</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">SKU</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Price</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Stock</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Value</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const stockStatus = 
                  product.countInStock === 0 ? 'out' :
                  product.countInStock < 10 ? 'low' : 'good';

                return (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiPackage className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-700">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {product._id.slice(-8).toUpperCase()}
                      </code>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      R{product.price.toFixed(2)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`font-semibold ${
                        stockStatus === 'out' ? 'text-red-600' :
                        stockStatus === 'low' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {product.countInStock}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      R{(product.price * product.countInStock).toFixed(2)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        stockStatus === 'out' ? 'bg-red-100 text-red-800' :
                        stockStatus === 'low' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {stockStatus === 'out' ? 'Out of Stock' :
                         stockStatus === 'low' ? 'Low Stock' :
                         'In Stock'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">No products match the selected filter</p>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
