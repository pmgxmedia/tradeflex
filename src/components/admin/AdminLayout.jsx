import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiPackage, 
  FiGrid, 
  FiFileText, 
  FiSettings, 
  FiShoppingCart, 
  FiUsers, 
  FiLayers,
  FiLogOut,
  FiMenu,
  FiX,
  FiTruck
} from 'react-icons/fi';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (desktop) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { name: 'Overview', path: '/admin/dashboard', icon: FiHome },
    { name: 'Products', path: '/admin/products', icon: FiPackage },
    { name: 'Categories', path: '/admin/categories', icon: FiGrid },
    { name: 'Orders', path: '/admin/orders', icon: FiShoppingCart },
    { name: 'Delivery', path: '/admin/delivery', icon: FiTruck },
    { name: 'Customers', path: '/admin/customers', icon: FiUsers },
    { name: 'Inventory', path: '/admin/inventory', icon: FiLayers },
    { name: 'Content', path: '/admin/content', icon: FiFileText },
    { name: 'Settings', path: '/admin/settings', icon: FiSettings },
  ];

  const handleExit = () => {
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const closeSidebar = () => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  };

  return (
  <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Overlay */}
      {sidebarOpen && !isDesktop && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          isDesktop 
            ? sidebarOpen ? 'w-64' : 'w-20'
            : sidebarOpen ? 'w-64' : '-translate-x-full'
        } bg-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col
        fixed md:relative h-screen md:h-auto overflow-y-auto pb-6 z-50 md:z-auto`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          {(sidebarOpen || isDesktop) && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">E</span>
              </div>
              {sidebarOpen && <span className="text-lg font-bold">Admin Panel</span>}
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors md:block"
          >
            <div className="bg-gradient-to-r from-blue-500 to-green-500 p-0.5 rounded inline-block">
              {sidebarOpen ? <FiX className="w-5 h-5 text-gray-900" /> : <FiMenu className="w-5 h-5 text-gray-900" />}
            </div>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="py-4">
          <ul className={`flex flex-col px-3 ${isDesktop ? 'justify-around h-full' : 'justify-start gap-3 mb-4'}`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={closeSidebar}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    title={!sidebarOpen ? item.name : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Exit Button */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleExit}
            className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-red-600 transition-all w-full group"
            title={!sidebarOpen ? 'Exit Admin Panel' : ''}
          >
            <div className="bg-gradient-to-r from-blue-500 to-green-500 p-0.5 rounded inline-block group-hover:from-white group-hover:to-white">
              <FiLogOut className="w-5 h-5 flex-shrink-0 text-gray-900 group-hover:text-white" />
            </div>
            {sidebarOpen && <span className="font-medium bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent group-hover:text-white">Exit</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Bar */}
        <header className="bg-white shadow-sm px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-green-500 p-0.5 rounded inline-block">
                  <FiMenu className="w-6 h-6 text-white" />
                </div>
              </button>
              <h1 className="admin-page-title font-bold text-gray-900">
                {menuItems.find(item => isActive(item.path))?.name || 'Admin Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:inline">Admin User</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
