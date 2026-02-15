import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Total Revenue
    const totalRevenueResult = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // This Month Revenue
    const monthRevenueResult = await Order.aggregate([
      { 
        $match: { 
          isPaid: true,
          paidAt: { $gte: firstDayOfMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const monthRevenue = monthRevenueResult[0]?.total || 0;

    // Last Month Revenue
    const lastMonthRevenueResult = await Order.aggregate([
      { 
        $match: { 
          isPaid: true,
          paidAt: { $gte: lastMonth, $lte: lastMonthEnd }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;

    // Calculate revenue growth
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : 0;

    // Total Orders
    const totalOrders = await Order.countDocuments();
    const monthOrders = await Order.countDocuments({ 
      createdAt: { $gte: firstDayOfMonth } 
    });
    const lastMonthOrders = await Order.countDocuments({ 
      createdAt: { $gte: lastMonth, $lte: lastMonthEnd } 
    });
    const ordersGrowth = lastMonthOrders > 0 
      ? ((monthOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(1)
      : 0;

    // Total Products
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ countInStock: { $lt: 10 } });

    // Total Customers
    const totalCustomers = await User.countDocuments({ isAdmin: false });
    const monthCustomers = await User.countDocuments({ 
      isAdmin: false,
      createdAt: { $gte: firstDayOfMonth } 
    });
    const lastMonthCustomers = await User.countDocuments({ 
      isAdmin: false,
      createdAt: { $gte: lastMonth, $lte: lastMonthEnd } 
    });
    const customersGrowth = lastMonthCustomers > 0 
      ? ((monthCustomers - lastMonthCustomers) / lastMonthCustomers * 100).toFixed(1)
      : 0;

    res.json({
      revenue: {
        total: totalRevenue,
        month: monthRevenue,
        growth: parseFloat(revenueGrowth)
      },
      orders: {
        total: totalOrders,
        month: monthOrders,
        growth: parseFloat(ordersGrowth)
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts
      },
      customers: {
        total: totalCustomers,
        month: monthCustomers,
        growth: parseFloat(customersGrowth)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sales statistics for charts
// @route   GET /api/stats/sales
// @access  Private/Admin
export const getSalesStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    const today = new Date();
    
    switch(period) {
      case '7d':
        startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(today.setDate(today.getDate() - 30));
        break;
      case '12m':
        startDate = new Date(today.setMonth(today.getMonth() - 12));
        break;
      default:
        startDate = new Date(today.setDate(today.getDate() - 7));
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          paidAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$paidAt' }
          },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(salesData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get top selling products
// @route   GET /api/stats/top-products
// @access  Private/Admin
export const getTopProducts = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const topProducts = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          totalSold: { $sum: '$orderItems.qty' },
          revenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          _id: 1,
          name: '$productInfo.name',
          image: '$productInfo.image',
          totalSold: 1,
          revenue: 1
        }
      }
    ]);

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recent orders
// @route   GET /api/stats/recent-orders
// @access  Private/Admin
export const getRecentOrders = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('_id user totalPrice isPaid isDelivered createdAt');

    res.json(recentOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
