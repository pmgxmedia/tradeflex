# 🚀 Quick Start Guide - EStore E-Commerce Platform

## Getting Started in 5 Minutes

### Step 1: Install Dependencies

**Frontend:**
```bash
cd estore
npm install
```

**Backend:**
```bash
cd backend
npm install
```

### Step 2: Set Up Environment Variables

**Backend** - Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/estore
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:5173
```

**Frontend** - Create `.env` (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start MongoDB

**Option A - Local MongoDB:**
```bash
mongod
```

**Option B - MongoDB Atlas:**
Use your Atlas connection string in `MONGODB_URI`

### Step 4: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend running on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
✅ Frontend running on `http://localhost:5173`

### Step 5: Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 🎯 What You Can Do Now

### As a Customer:
1. **Browse Products** - Visit homepage and click "Shop Now"
2. **Search & Filter** - Use search bar and category filters
3. **Add to Cart** - Click on any product and add to cart
4. **Register** - Create an account via "Sign In" → "Create new account"
5. **Checkout** - Complete purchase with test payment

### As an Admin:
1. **Create Admin Account** - Register, then manually update user role in MongoDB:
   ```javascript
   db.users.updateOne(
     { email: "your@email.com" },
     { $set: { role: "admin" } }
   )
   ```
2. **Access Dashboard** - Login and visit `/admin/dashboard`
3. **Add Products** - Click "Add Product" button
4. **Manage Orders** - View and update order statuses
5. **View Analytics** - Check revenue, orders, and user stats

## 📦 Sample Data (Optional)

Create `backend/seedData.js`:
```javascript
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');

const seedData = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Clear existing data
  await User.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});

  // Create admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@estore.com',
    password: 'admin123',
    role: 'admin'
  });

  // Create categories
  const electronics = await Category.create({
    name: 'Electronics',
    description: 'Electronic devices and gadgets'
  });

  const clothing = await Category.create({
    name: 'Clothing',
    description: 'Fashion and apparel'
  });

  // Create products
  await Product.create([
    {
      name: 'Wireless Headphones',
      description: 'Premium noise-cancelling wireless headphones',
      price: 199.99,
      category: electronics._id,
      brand: 'TechBrand',
      stock: 50,
      images: ['https://via.placeholder.com/400'],
      rating: 4.5,
      numReviews: 10
    },
    {
      name: 'Smart Watch',
      description: 'Fitness tracking smart watch',
      price: 299.99,
      category: electronics._id,
      brand: 'TechBrand',
      stock: 30,
      images: ['https://via.placeholder.com/400'],
      rating: 4.7,
      numReviews: 15
    },
    {
      name: 'Cotton T-Shirt',
      description: 'Comfortable cotton t-shirt',
      price: 29.99,
      category: clothing._id,
      brand: 'FashionCo',
      stock: 100,
      images: ['https://via.placeholder.com/400'],
      rating: 4.3,
      numReviews: 20
    }
  ]);

  console.log('✅ Data seeded successfully!');
  process.exit();
};

seedData().catch(console.error);
```

**Run it:**
```bash
cd backend
node seedData.js
```

## 🔧 Troubleshooting

### Frontend won't start?
- Check if port 5173 is available
- Run `npm install` again
- Clear node_modules: `rm -rf node_modules && npm install`

### Backend won't start?
- Ensure MongoDB is running
- Check `.env` file exists in backend folder
- Verify MongoDB connection string
- Check port 5000 is not in use

### Can't connect to backend?
- Ensure both frontend and backend are running
- Check CORS settings in `backend/server.js`
- Verify API URL in frontend matches backend port

### Database connection failed?
- Start MongoDB: `mongod`
- Or use MongoDB Atlas cloud database
- Check MongoDB URI format is correct

## 📱 Test the Features

### Test Shopping Flow:
1. Browse products on homepage
2. Click on a product
3. Add to cart
4. Go to cart
5. Proceed to checkout
6. Fill shipping info
7. Select payment method
8. Place order

### Test Admin Features:
1. Login as admin
2. Visit `/admin/dashboard`
3. Click "Add Product"
4. Fill product form
5. View product in admin products list
6. Edit or delete product
7. Manage orders

## 🎨 Customize Your Store

### Change Colors:
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
      secondary: '#your-color',
    },
  },
},
```

### Update Branding:
- Logo: Update `Navbar.jsx` and `Footer.jsx`
- Site name: Replace "EStore" throughout the app
- Favicon: Add to `public/` folder

### Add Features:
- Wishlist: Create new context similar to CartContext
- Reviews: Already built into ProductDetail
- Coupons: Add coupon field in Checkout
- Multi-language: Use react-i18next

## 🚀 Going to Production

### Before deploying:
1. Change JWT_SECRET to a strong random string
2. Update MongoDB_URI to production database
3. Set NODE_ENV=production
4. Enable HTTPS
5. Set up proper error logging
6. Configure payment gateways
7. Add email service
8. Set up image hosting (Cloudinary/AWS S3)

### Deploy Backend:
- Heroku, Railway, Render, or AWS

### Deploy Frontend:
- Vercel, Netlify, or AWS S3 + CloudFront

## 📚 Next Steps

1. ✅ Complete this quick start
2. 📖 Read full [SETUP_GUIDE.md](./SETUP_GUIDE.md)
3. 🎨 Customize the design
4. 📦 Add your products
5. 🚀 Deploy to production
6. 📈 Monitor and optimize

## 💡 Tips

- Use MongoDB Compass for easier database management
- Install React DevTools browser extension
- Use Postman to test API endpoints
- Enable auto-save in your IDE
- Commit changes regularly to git

## 🆘 Need Help?

- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed docs
- Review error messages carefully
- Check browser console for frontend errors
- Check terminal for backend errors
- Ensure all dependencies are installed

---

**Happy Coding! 🎉**

Built with ❤️ using React, Node.js, Express, and MongoDB
