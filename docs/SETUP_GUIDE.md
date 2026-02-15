# EStore - Full-Stack E-Commerce Platform

A modern, professional e-commerce platform built with React, Node.js, Express, and MongoDB. Features responsive design, secure authentication, payment integration, and comprehensive admin dashboard.

## 🚀 Features

### Customer Features
- **Modern Storefront**: Responsive design with mobile, tablet, and desktop breakpoints
- **Product Browsing**: Advanced filtering, sorting, search, and pagination
- **Product Details**: Image galleries, reviews, ratings, and variant support
- **Shopping Cart**: Persistent cart with quantity management
- **Secure Checkout**: Multi-step checkout with address validation
- **Payment Integration**: Support for Credit/Debit cards, PayPal, and Cash on Delivery
- **User Authentication**: JWT-based secure login and registration
- **User Profile**: Manage personal information and addresses
- **Order History**: Track all orders with status updates

### Admin Features
- **Dashboard**: Real-time stats for revenue, orders, products, and users
- **Product Management**: Full CRUD operations for products
- **Order Management**: View and update order statuses
- **Inventory Tracking**: Monitor stock levels
- **Category Management**: Organize products into categories
- **User Management**: View and manage customer accounts

### Technical Features
- **SEO Optimized**: Meta tags, clean URLs, and semantic HTML
- **Fast Performance**: Code splitting, lazy loading, and optimized images
- **Secure**: JWT authentication, password hashing, CORS protection
- **Responsive**: Mobile-first design with Tailwind CSS
- **State Management**: Context API for auth and cart
- **API Integration**: RESTful backend with comprehensive endpoints
- **Error Handling**: Global error handling and user-friendly messages

## 📦 Tech Stack

### Frontend
- **React 19** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS 4** - Styling
- **Vite** - Build tool
- **React Icons** - Icon library
- **React Helmet Async** - SEO management
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd estore
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

### 3. Environment Configuration

Create `.env` file in the `backend` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/estore
# or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/estore

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 4. Seed Database (Optional)

Create sample data for testing:

```bash
cd backend
node seedData.js
```

### 5. Run the Application

**Start Backend (from backend folder):**
```bash
npm run dev
```
Backend runs on: `http://localhost:5000`

**Start Frontend (from root folder):**
```bash
npm run dev
```
Frontend runs on: `http://localhost:5173`

## 📁 Project Structure

```
estore/
├── backend/
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── controllers/
│   │   ├── userController.js  # User logic
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   └── categoryController.js
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT & admin protection
│   │   └── errorMiddleware.js # Error handling
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Product.js         # Product schema
│   │   ├── Order.js           # Order schema
│   │   └── Category.js        # Category schema
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   └── categoryRoutes.js
│   ├── utils/
│   │   └── generateToken.js   # JWT generation
│   ├── server.js              # Express server
│   └── package.json
│
├── src/
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Alert.jsx
│   │   ├── layout/            # Layout components
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   ├── ProtectedRoute.jsx # Route guards
│   │   └── SEO.jsx            # SEO component
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx    # Authentication state
│   │   └── CartContext.jsx    # Shopping cart state
│   │
│   ├── pages/
│   │   ├── Home.jsx           # Landing page
│   │   ├── ProductList.jsx    # Product catalog
│   │   ├── ProductDetail.jsx  # Product details
│   │   ├── Cart.jsx           # Shopping cart
│   │   ├── Checkout.jsx       # Checkout flow
│   │   ├── Login.jsx          # User login
│   │   ├── Register.jsx       # User registration
│   │   ├── Profile.jsx        # User profile
│   │   ├── Orders.jsx         # Order history
│   │   └── admin/             # Admin pages
│   │       ├── AdminDashboard.jsx
│   │       ├── AdminProducts.jsx
│   │       └── AdminOrders.jsx
│   │
│   ├── services/
│   │   └── api.js             # API service layer
│   │
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
│
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🔑 Default Admin Account

After seeding the database, use these credentials:

```
Email: admin@estore.com
Password: admin123
```

## 🌐 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

### Products
- `GET /api/products` - Get all products (with pagination & filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `POST /api/products/:id/reviews` - Add review

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/myorders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders` - Get all orders (Admin)
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

## 🎨 Design Features

### Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Color Scheme
- **Primary**: Blue (#2563eb)
- **Secondary**: Purple (#9333ea)
- **Success**: Green (#16a34a)
- **Error**: Red (#dc2626)
- **Warning**: Yellow (#eab308)

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes (client & server)
- CORS configuration
- Input validation
- SQL injection protection via Mongoose
- XSS protection

## 📱 Payment Integration

The checkout supports:
1. **Credit/Debit Cards** - Stripe-ready integration
2. **PayPal** - PayPal SDK integration
3. **Cash on Delivery** - Traditional payment method

To enable Stripe:
1. Install: `npm install @stripe/stripe-js @stripe/react-stripe-js`
2. Add your publishable key in `.env`
3. Implement payment intent creation in backend

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy `dist` folder
3. Set environment variable: `VITE_API_URL=your-backend-url`

### Backend (Heroku/Railway/Render)
1. Set environment variables
2. Deploy from `backend` folder
3. Ensure MongoDB connection string is set

## 📈 Performance Optimization

- Code splitting with React.lazy
- Image optimization
- Lazy loading for images
- Memoization for expensive computations
- Debounced search
- Pagination for large datasets

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run backend tests
cd backend
npm test
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For support, email support@estore.com or open an issue in the repository.

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- MongoDB for the database
- All contributors and users

---

Built with ❤️ by the EStore Team
