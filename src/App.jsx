import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminLayout from './components/admin/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Customer Pages
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import AdminSetup from './pages/AdminSetup';

// Admin Pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminInventory from './pages/admin/AdminInventory';
import AdminContent from './pages/admin/AdminContent';
import AdminSettings from './pages/admin/AdminSettings';
import ProductForm from './pages/admin/ProductForm';
import AdminDeliveryManagement from './pages/admin/AdminDeliveryManagement';
import DeliveryProviderDashboard from './pages/DeliveryProviderDashboard';
import DeliveryProviderRegister from './pages/DeliveryProviderRegister';

import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <SettingsProvider>
            <AnalyticsProvider>
              <CartProvider>
                <Routes>
            {/* Admin Routes - Without Navbar/Footer, using AdminLayout */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminOverview />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminProducts />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products/new"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <ProductForm />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products/edit/:id"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <ProductForm />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminCategories />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminOrders />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminCustomers />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminInventory />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/content"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminContent />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminSettings />
                  </AdminLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/delivery"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminDeliveryManagement />
                  </AdminLayout>
                </AdminRoute>
              }
            />

            {/* Public Routes with Navbar and Footer */}
            <Route
              path="/*"
              element={
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<ProductList />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/admin-setup" element={<AdminSetup />} />
                      <Route path="/delivery-provider" element={<DeliveryProviderDashboard />} />
                      <Route path="/delivery-provider/register" element={<DeliveryProviderRegister />} />

                      {/* Protected Routes */}
                      <Route
                        path="/checkout"
                        element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/orders"
                        element={
                          <ProtectedRoute>
                            <Orders />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/order/:id"
                        element={
                          <ProtectedRoute>
                            <OrderDetail />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              }
            />
          </Routes>
        </CartProvider>
        </AnalyticsProvider>
      </SettingsProvider>
      </AuthProvider>
    </Router>
    </ErrorBoundary>
  );
}

export default App;

