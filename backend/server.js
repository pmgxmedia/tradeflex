import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import heroBannerRoutes from './routes/heroBannerRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Increase body size limit to handle base64 encoded images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'EStore API is running...' });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    cors: process.env.CLIENT_URL
  });
});

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/hero-banners', heroBannerRoutes);
app.use('/api/analytics', analyticsRoutes);

// Import and use delivery routes
import deliveryRoutes from './routes/deliveryRoutes.js';
app.use('/api/delivery', deliveryRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket.IO real-time inventory monitoring
io.on('connection', (socket) => {
  console.log('✓ Admin client connected for real-time inventory');

  // Send initial inventory stats
  const sendInventoryStats = async () => {
    try {
      // Dynamic import to avoid circular dependency issues
      const { default: Product } = await import('./models/Product.js');
      const { default: Order } = await import('./models/Order.js');
      
      const products = await Product.find()
        .populate('category', 'name')
        .sort({ createdAt: -1 });
      
      const lowStockProducts = products.filter(p => p.countInStock > 0 && p.countInStock < 10);
      const outOfStockProducts = products.filter(p => p.countInStock === 0);
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.countInStock), 0);
      
      // Get recent orders for activity monitoring
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email');
      
      const stats = {
        products,
        metrics: {
          totalProducts: products.length,
          lowStock: lowStockProducts.length,
          outOfStock: outOfStockProducts.length,
          totalValue: totalValue.toFixed(2),
          lowStockProducts: lowStockProducts.map(p => ({
            id: p._id,
            name: p.name,
            stock: p.countInStock
          })),
          outOfStockProducts: outOfStockProducts.map(p => ({
            id: p._id,
            name: p.name
          }))
        },
        recentActivity: recentOrders.map(order => ({
          id: order._id,
          customer: order.user?.name || 'Guest',
          items: order.orderItems.length,
          total: order.totalPrice,
          createdAt: order.createdAt
        })),
        timestamp: new Date().toISOString()
      };
      
      socket.emit('inventoryStats', stats);
    } catch (error) {
      console.error('Error sending inventory stats:', error);
      socket.emit('inventoryError', { message: error.message });
    }
  };

  // Send initial stats
  sendInventoryStats();

  // Send updates every 3 seconds for real-time monitoring
  const inventoryInterval = setInterval(sendInventoryStats, 3000);

  // Handle manual refresh requests
  socket.on('refreshInventory', () => {
    sendInventoryStats();
  });

  socket.on('disconnect', () => {
    console.log('✗ Admin client disconnected from inventory monitoring');
    clearInterval(inventoryInterval);
  });
});

const server = httpServer.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV}`);
  console.log(`✓ WebSocket server enabled for real-time updates`);
});

// Connect to MongoDB after server starts
connectDB()
  .then(() => console.log('✓ MongoDB connected successfully'))
  .catch((err) => {
    console.error('✗ MongoDB connection failed:', err.message);
    // Don't exit - allow server to run without DB for debugging
  });
