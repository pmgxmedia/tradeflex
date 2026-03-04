import { Link, useNavigate } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiMail } from 'react-icons/fi';
import { useSettings } from '../../contexts/SettingsContext';
import { useState, useRef, useEffect } from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [showAdminLinks, setShowAdminLinks] = useState(false);
  const footerRef = useRef(null);
  const logoRef = useRef(null);
  const adminBubbleRef = useRef(null);
  const lastLogoTapRef = useRef(0);
  const [adminPosition, setAdminPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleAdminAccess = () => {
    console.log('Admin button clicked - navigating to /admin/dashboard');
    navigate('/admin/dashboard');
  };

  // Custom double-tap handler using click events so it works reliably on mobile.
  // First tap arms, second tap within the window toggles admin links.
  const handleLogoClick = () => {
    const now = Date.now();
    const lastTap = lastLogoTapRef.current;

    if (lastTap && now - lastTap < 400) {
      setShowAdminLinks(prev => !prev);
      lastLogoTapRef.current = 0; // reset so a third quick tap doesn't immediately toggle again
    } else {
      lastLogoTapRef.current = now;
    }
  };

  const handleAdminDragStart = (e) => {
    if (!footerRef.current || !adminBubbleRef.current) return;

    e.preventDefault();
    const pointerX = e.clientX;
    const pointerY = e.clientY;

    const bubbleRect = adminBubbleRef.current.getBoundingClientRect();

    dragOffsetRef.current = {
      x: pointerX - bubbleRect.left,
      y: pointerY - bubbleRect.top,
    };

    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      if (!footerRef.current || !adminBubbleRef.current) return;

      const footerRect = footerRef.current.getBoundingClientRect();
      const bubbleRect = adminBubbleRef.current.getBoundingClientRect();

      const pointerX = e.clientX;
      const pointerY = e.clientY;

      let newX = pointerX - footerRect.left - dragOffsetRef.current.x;
      let newY = pointerY - footerRect.top - dragOffsetRef.current.y;

      const maxX = footerRect.width - bubbleRect.width - 8;
      const maxY = footerRect.height - bubbleRect.height - 8;

      newX = Math.max(8, Math.min(newX, maxX));
      newY = Math.max(8, Math.min(newY, maxY));

      setAdminPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  // Default position: just below the logo when admin links are shown
  useEffect(() => {
    if (!showAdminLinks || !footerRef.current || !logoRef.current || !adminBubbleRef.current || isDragging) {
      return;
    }

    const footerRect = footerRef.current.getBoundingClientRect();
    const logoRect = logoRef.current.getBoundingClientRect();
    const bubbleRect = adminBubbleRef.current.getBoundingClientRect();

    const centerX = logoRect.left - footerRect.left + logoRect.width / 2;
    let newX = centerX - bubbleRect.width / 2;
    let newY = logoRect.bottom - footerRect.top + 8;

    const maxX = footerRect.width - bubbleRect.width - 8;
    const maxY = footerRect.height - bubbleRect.height - 8;

    newX = Math.max(8, Math.min(newX, maxX));
    newY = Math.max(8, Math.min(newY, maxY));

    setAdminPosition({ x: newX, y: newY });
  }, [showAdminLinks, isDragging]);

  return (
    <footer ref={footerRef} className="bg-gray-900 text-gray-300 relative mt-8 sm:mt-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div>
            <div
              ref={logoRef}
              className="flex items-center space-x-2 mb-4"
              onClick={handleLogoClick}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {settings.siteName?.charAt(0) || 'E'}
                </span>
              </div>
              <span className="text-xl font-bold text-white">
                {settings.siteName || 'No Store'}
              </span>
            </div>
            <p className="text-sm mb-4">
              Your trusted destination for quality products at great prices. Shop with confidence.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-400 transition-colors">
                <FiFacebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                <FiInstagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                <FiLinkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="hover:text-blue-400 transition-colors text-sm">
                  Shop All Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-blue-400 transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-400 transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-blue-400 transition-colors text-sm">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="hover:text-blue-400 transition-colors text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-blue-400 transition-colors text-sm">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-blue-400 transition-colors text-sm">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-blue-400 transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <p className="text-sm">
                © {currentYear} {settings.siteName || 'No Store'}. All rights reserved.
              </p>
              {showAdminLinks && (
                <div className="hidden md:flex items-center space-x-2">
                  <button
                    onClick={handleAdminAccess}
                    className="text-lg text-red-400 hover:text-blue-400 transition-colors select-none cursor-pointer px-2 py-1"
                    title="Admin access"
                  >
                    ⚙
                  </button>
                  <Link 
                    to="/admin-setup"
                    className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    title="Setup admin account"
                  >
                    ADMIN SETUP
                  </Link>
                  <Link 
                    to="/admin/test-no-auth"
                    className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
                  >
                    TEST
                  </Link>
                </div>
              )}
            </div>
            <div className="flex space-x-6 text-sm">
              <Link to="/privacy" className="hover:text-blue-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-blue-400 transition-colors">
                Terms of Service
              </Link>
              <Link to="/cookies" className="hover:text-blue-400 transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>

        {showAdminLinks && (
          <div
            ref={adminBubbleRef}
            className="md:hidden absolute z-50 bg-gray-800/95 border border-blue-500 rounded-full shadow-lg flex items-center space-x-2 px-3 py-2 text-xs"
            style={{ top: adminPosition.y, left: adminPosition.x }}
            onPointerDown={handleAdminDragStart}
          >
            <button
              onClick={handleAdminAccess}
              className="text-base text-gray-100 hover:text-blue-300 transition-colors select-none cursor-pointer"
              title="Admin access"
            >
              ⚙
            </button>
            <Link 
              to="/admin-setup"
              className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 whitespace-nowrap"
              title="Setup admin account"
            >
              ADMIN
            </Link>
            <Link 
              to="/admin/test-no-auth"
              className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 whitespace-nowrap"
            >
              TEST
            </Link>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;
