# EStore - E-commerce Application

## Overview
Full-stack e-commerce application built with React (Vite) on the frontend and Node.js/Express on the backend, using MongoDB for the database.

## Architecture
- **Frontend**: React 19 + Vite, Tailwind CSS, running on port 5000
- **Backend**: Node.js/Express API with Socket.IO for real-time updates, running on port 3001
- **Database**: MongoDB (via Mongoose)
- **Auth**: JWT-based authentication with bcryptjs

## Project Structure
```
/
├── src/                    # React frontend source
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React context providers (Auth, Cart, Settings, Analytics)
│   ├── pages/              # Route-level page components
│   │   └── admin/          # Admin dashboard pages
│   ├── services/           # API service layer (api.js)
│   └── utils/              # Utility helpers
├── backend/                # Node.js/Express backend
│   ├── config/db.js        # MongoDB connection
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth & error middleware
│   ├── models/             # Mongoose data models
│   ├── routes/             # Express route definitions
│   ├── scripts/            # Utility scripts (seed, reset)
│   ├── utils/              # Email, PDF, token utilities
│   └── server.js           # Entry point
└── public/                 # Static assets
```

## Key Features
- Product catalog with categories, search, and filtering
- User authentication and profiles
- Shopping cart and checkout
- Order management
- Admin dashboard with analytics, inventory management, banners
- Real-time inventory monitoring via Socket.IO
- Delivery provider system
- Hero banners and promotional banners

## Workflows
- **Start application**: `npm run dev` → frontend on port 5000 (webview)
- **Backend API**: `cd backend && node server.js` → API on port 3001 (console)

## Environment Variables
- `MONGODB_URI` (secret) — MongoDB connection string
- `PORT` — Backend port (set to 3001)
- `NODE_ENV` — Environment (development)
- `JWT_SECRET` — JWT signing secret
- `JWT_EXPIRE` — JWT expiration (30d)
- `FRONTEND_URL` / `CLIENT_URL` — Frontend URL for CORS

## Vite Configuration
- Host: `0.0.0.0`, Port: `5000`, `allowedHosts: true` (required for Replit proxy)
- API proxy: `/api` → `http://localhost:3001`

## Deployment
- **Target**: Autoscale
- **Build**: `npm install && npm run build && cd backend && npm install` (installs deps + builds Vite frontend into `dist/`)
- **Run**: `cd backend && NODE_ENV=production PORT=5000 node server.js` (backend serves both API and static frontend)
- In production, the Express server serves the built Vite frontend from `dist/` and handles SPA routing with a `*` catch-all

## SEO
- `src/components/SEO.jsx` — Reusable component that dynamically sets document title, meta tags (description, keywords, og, twitter), canonical URLs, and JSON-LD structured data
- Uses `useSettings()` context to pull dynamic site name for page titles
- Integrated into all customer-facing pages: Home, ProductList, ProductDetail, Login, Register, Cart, Checkout, Orders, OrderDetail, Profile
- `index.html` includes base meta tags (robots, theme-color, og:image, canonical, twitter card) as fallbacks
- ProductDetail page includes Product schema.org structured data with pricing, availability, and ratings
- Home page includes WebSite schema.org structured data with SearchAction

## UI/Layout
- Consistent horizontal padding across sections: `px-6 sm:px-8 lg:px-12`
- Footer has top margin (`mt-8 sm:mt-12`), consistent padding, and wider grid gaps on large screens
- Navbar center links use `space-x-10` for breathing room between Catalog, New Arrivals, Flash Sale
- Home page sections use standardized vertical padding (`py-12 sm:py-16 md:py-20`)
- Product grid: `grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`

## Notes
- The backend is set to not crash on MongoDB connection failure (for debugging without DB)
- Socket.IO is used for real-time inventory stats in the admin panel
- The frontend uses Vite's proxy for API calls in development
- In production, the backend serves both API routes and the built frontend on a single port (5000)
- Mobile search bar in Navbar only shows when mobile menu is open (not always visible)
- Products API is slow (~2s) due to base64 images stored directly in MongoDB - consider using external image storage for better performance
- Analytics endpoints (pageview, session) return 404/500 when sessions aren't found - non-blocking but generates console warnings
