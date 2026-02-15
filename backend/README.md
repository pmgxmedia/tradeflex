# EStore Backend API

Backend API for EStore ecommerce application built with Express.js and MongoDB.

## Features

- RESTful API architecture
- MongoDB database with Mongoose ODM
- JWT authentication
- User registration and login
- Admin authorization
- Product management (CRUD)
- Category management
- Order management
- Review system
- Secure password hashing with bcrypt
- Error handling middleware

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file and configure your environment variables (see `.env` for required variables)

4. Start the server:

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication & Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `POST /api/users/logout` - Logout user
- `GET /api/users/profile` - Get user profile (Protected)
- `PUT /api/users/profile` - Update user profile (Protected)
- `GET /api/users` - Get all users (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `POST /api/products/:id/reviews` - Create product review (Protected)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Orders
- `POST /api/orders` - Create new order (Protected)
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/myorders` - Get logged in user orders (Protected)
- `GET /api/orders/:id` - Get order by ID (Protected)
- `PUT /api/orders/:id/pay` - Update order to paid (Protected)
- `PUT /api/orders/:id/deliver` - Update order to delivered (Admin)
- `PUT /api/orders/:id/status` - Update order status (Admin)

## Database Models

- **User**: name, email, password, role, avatar, phone, address
- **Product**: name, description, price, category, brand, stock, images, reviews, rating
- **Category**: name, description, image, slug
- **Order**: user, orderItems, shippingAddress, paymentMethod, prices, status

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT
- `JWT_EXPIRE` - JWT expiration time
- `NODE_ENV` - Environment (development/production)

## Future Enhancements

- Image upload functionality with Multer
- Payment gateway integration (Stripe/PayPal)
- Email notifications
- Advanced search and filtering
- Inventory management
- Sales analytics
- Coupon/discount system
