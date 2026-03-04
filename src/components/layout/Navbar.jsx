import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useSettings } from '../../contexts/SettingsContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { getCartCount } = useCart();
  const { settings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cartCount = getCartCount();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-white/90 via-blue-50/90 to-indigo-50/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo */}
          <div className="flex items-center min-w-0">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-900 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12 flex-shrink-0">
                <span className="text-white font-black text-lg sm:text-xl italic">
                  {settings.siteName?.charAt(0) || 'E'}
                </span>
              </div>
              <span className="text-xs sm:text-lg md:text-2xl font-black text-gray-900 tracking-tight whitespace-nowrap truncate max-w-[6.5rem] sm:max-w-none">
                {settings.siteName || 'EStore'}
              </span>
            </Link>
          </div>

          {/* Nav Links - Center (Optional, but looks good) */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link to="/products" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest">
              Catalog
            </Link>
            <Link to="/products?category=new" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest">
              New Arrivals
            </Link>
            <Link to="/products?category=sale" className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest">
              Flash Sale
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 sm:space-x-4 ml-1 sm:ml-4">
            {/* Search - Desktop */}
            <div className="hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-48 lg:w-64 pl-4 pr-10 py-2 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-gray-200 transition-all font-medium"
                />
                <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </form>
            </div>

            {/* Cart */}
            <Link to="/cart" className="relative p-1 sm:p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <FiShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-1 pl-2 hover:bg-gray-100 rounded-2xl transition-colors">
                  <span className="hidden sm:block text-sm font-bold text-gray-700">{user?.name}</span>
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {user?.name.charAt(0)}
                  </div>
                </button>
                
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-gray-200/50 py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                  <div className="px-4 py-2 border-b border-gray-50 mb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account</p>
                  </div>
                  <Link to="/profile" className="block px-4 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    My Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    My Orders
                  </Link>
                  {isAdmin && (
                    <>
                      <hr className="my-2" />
                      <Link
                        to="/admin/dashboard"
                        className="block px-4 py-2 text-blue-600 hover:bg-gray-100 font-medium"
                      >
                        Admin Dashboard
                      </Link>
                    </>
                  )}
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600"
            >
              {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-5 pr-12 py-3 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-gray-200"
              />
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-6 space-y-4 shadow-xl">
          <div className="space-y-4">
            <Link
              to="/products"
              className="block text-lg font-bold text-gray-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              Catalog
            </Link>
            <Link
              to="/products?category=new"
              className="block text-lg font-bold text-gray-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              New Arrivals
            </Link>
            <Link
              to="/products?category=sale"
              className="block text-lg font-bold text-red-500"
              onClick={() => setMobileMenuOpen(false)}
            >
              Flash Sale
            </Link>
          </div>
          <hr className="border-gray-100" />
          <div className="space-y-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="block text-gray-600 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
                <Link
                  to="/orders"
                  className="block text-gray-600 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="block text-blue-600 font-bold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-red-500 font-bold"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block text-blue-600 font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
