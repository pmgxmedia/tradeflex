import { Link } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { user, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();

  const userName = user?.name || 'Guest';
  const userInitial = (userName && userName[0]) || 'U';

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Trade Sales",
    "url": "/",
    "logo": "/logo.png"
  };

  return (
    <header>
      {/* Promo strip for promotions (visible on all devices) */}
      <div className="w-full bg-green-600 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center">
          <span className="mr-3 font-semibold">Limited time:</span>
          <span className="mr-4">Free shipping on orders over $50</span>
          <Link to="/products?category=sale" className="bg-white text-green-600 px-3 py-1 rounded-full font-semibold">Shop Flash Sale</Link>
        </div>
      </div>

      <nav className="bg-gradient-to-r from-white/90 via-blue-50/90 to-indigo-50/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-md" role="navigation" aria-label="Main navigation">
        {/* JSON-LD for basic organization schema to help SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group" data-discover="true" aria-label="Homepage">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
                  <span className="text-white font-black text-xl italic">T</span>
                </div>
                <span className="text-2xl font-black text-gray-900 tracking-tight">Trade Sales</span>
              </Link>
            </div>

            <div className="hidden lg:flex items-center space-x-8">
              <Link to="/products" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest" data-discover="true">Catalog</Link>
              <Link to="/products?category=new" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest" data-discover="true">New Arrivals</Link>
              <Link to="/products?category=sale" className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest" data-discover="true">Flash Sale</Link>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-5">
              <div className="hidden md:block">
                <form className="relative" role="search" aria-label="Site search" onSubmit={(e) => e.preventDefault()}>
                  <input
                    placeholder="Search..."
                    className="w-48 lg:w-64 pl-4 pr-10 py-2 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-gray-200 transition-all font-medium"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search products"
                  />
                  <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </form>
              </div>

              <Link to="/cart" className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors" data-discover="true" aria-label="Cart">
                <FiShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>
                )}
              </Link>

              <div className="relative group">
                <button className="flex items-center space-x-2 p-1 pl-2 hover:bg-gray-100 rounded-2xl transition-colors" aria-haspopup="true" aria-expanded="false">
                  <span className="hidden sm:block text-sm font-bold text-gray-700">{userName}</span>
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">{userInitial}</div>
                </button>

                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-gray-200/50 py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                  <div className="px-4 py-2 border-b border-gray-50 mb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account</p>
                  </div>
                  <Link className="block px-4 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors" to="/profile" data-discover="true">My Profile</Link>
                  <Link className="block px-4 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors" to="/orders" data-discover="true">My Orders</Link>
                  <hr className="my-2" />
                  {isAdmin && <Link className="block px-4 py-2 text-blue-600 hover:bg-gray-100 font-medium" to="/admin/dashboard" data-discover="true">Admin Dashboard</Link>}
                  <hr className="my-2" />
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center space-x-2">
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="md:hidden flex items-center">
              <button className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
                {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          <div className="md:hidden pb-6">
            <form className="relative" role="search" aria-label="Mobile search" onSubmit={(e) => e.preventDefault()}>
              <input placeholder="Search products..." className="w-full pl-5 pr-12 py-3 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-gray-200" type="text" value={query} onChange={(e) => setQuery(e.target.value)} />
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </form>

            {/* Mobile links: show when menu toggled */}
            {isMenuOpen && (
              <div className="mt-4 space-y-3">
                <Link to="/products" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Catalog</Link>
                <Link to="/products?category=new" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>New Arrivals</Link>
                <Link to="/products?category=sale" className="block px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Flash Sale</Link>
                <Link to="/cart" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Cart ({cartCount})</Link>
                {user ? (
                  <>
                    <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                    <Link to="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>My Orders</Link>
                    {isAdmin && <Link to="/admin/dashboard" className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Admin Dashboard</Link>}
                    <button onClick={() => { logout(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 rounded-lg">Logout</button>
                  </>
                ) : (
                  <Link to="/login" className="block px-4 py-2 text-blue-600 font-medium" onClick={() => setIsMenuOpen(false)}>Login</Link>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
