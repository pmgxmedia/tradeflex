import { useState, useRef, useEffect } from 'react';
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const cartCount = getCartCount();

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e) => {
      if (searchInputRef.current && !searchInputRef.current.closest('form').contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          <div className="flex items-center min-w-0">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-900 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12 flex-shrink-0">
                <span className="text-white font-black text-lg sm:text-xl italic">
                  {settings.siteName?.charAt(0) || 'E'}
                </span>
              </div>
              <span className="text-sm sm:text-lg md:text-2xl font-black text-gray-900 tracking-tight whitespace-nowrap truncate max-w-[6.5rem] sm:max-w-none">
                {settings.siteName || 'EStore'}
              </span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center space-x-10">
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

          <div className="flex items-center gap-1 sm:gap-3">
            <div className="hidden md:flex items-center">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="relative flex items-center">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-48 lg:w-64 pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all font-medium outline-none"
                  />
                  <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="Close search">
                    <FiX className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Search"
                >
                  <FiSearch className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="hidden md:block w-px h-6 bg-gray-200"></div>

            <Link
              to="/cart"
              className="relative w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Cart"
            >
              <FiShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gray-900 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="hidden md:block w-px h-6 bg-gray-200"></div>

            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 py-1.5 pl-3 pr-1.5 hover:bg-gray-50 rounded-full transition-colors">
                  <span className="hidden sm:block text-sm font-semibold text-gray-700 max-w-[100px] truncate">{user?.name}</span>
                  <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
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
                        className="block px-4 py-2 text-gray-900 hover:bg-gray-50 font-semibold"
                      >
                        Admin Dashboard
                      </Link>
                    </>
                  )}
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors text-sm font-semibold"
                aria-label="Sign In"
              >
                <FiUser className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors ml-1"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none"
              />
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </form>
          </div>

          <div className="px-4 pb-4 space-y-1">
            <Link
              to="/products"
              className="block px-3 py-2.5 text-base font-semibold text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Catalog
            </Link>
            <Link
              to="/products?category=new"
              className="block px-3 py-2.5 text-base font-semibold text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              New Arrivals
            </Link>
            <Link
              to="/products?category=sale"
              className="block px-3 py-2.5 text-base font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Flash Sale
            </Link>

            <div className="border-t border-gray-100 my-2 pt-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-3 py-2.5 text-base text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-3 py-2.5 text-base text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      className="block px-3 py-2.5 text-base text-gray-900 font-semibold hover:bg-gray-50 rounded-xl transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2.5 text-base text-red-500 font-semibold hover:bg-red-50 rounded-xl transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-3 py-2.5 text-base text-gray-900 font-semibold hover:bg-gray-50 rounded-xl transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
