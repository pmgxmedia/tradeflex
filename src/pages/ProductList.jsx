import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getProducts, getCategories, getProductById, toggleProductLike } from '../services/api';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import SEO from '../components/SEO';
import { FiStar, FiFilter, FiEye, FiHeart, FiShoppingCart, FiX, FiMinus, FiPlus, FiArrowLeft } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { getDeviceId, hasLikedProduct, toggleProductLikeLocal } from '../utils/deviceId';

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  // Format price with thousand separators
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    minPrice: '',
    maxPrice: '',
    sort: searchParams.get('sort') || '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [likedProducts, setLikedProducts] = useState({});
  const [notification, setNotification] = useState(null);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalQuantity, setModalQuantity] = useState(1);
  const { addToCart } = useCart();

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    
    // Initialize liked products state
    if (products.length > 0) {
      const initialLikes = {};
      products.forEach(product => {
        initialLikes[product._id] = hasLikedProduct(product._id);
      });
      setLikedProducts(initialLikes);
    }
  }, [filters, currentPage]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        ...(filters.search && { keyword: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.sort && { sort: filters.sort }),
      };

      const data = await getProducts(params);
      setProducts(data.products || []);
      setTotalProducts(data.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
    
    // Update URL
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      sort: '',
    });
    setSearchParams({});
  };

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  // Handle toggle like
  const handleToggleLike = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const deviceId = getDeviceId();
      const result = await toggleProductLike(productId, deviceId);
      
      // Update local state
      setLikedProducts(prev => ({ ...prev, [productId]: result.liked }));
      toggleProductLikeLocal(productId);
      
      // Update the product in the list
      setProducts(prev => prev.map(p => 
        p._id === productId ? { ...p, likes: result.likes } : p
      ));
      
      if (result.liked) {
        showNotification('Added to wishlist!', 'success');
      } else {
        showNotification('Removed from wishlist', 'info');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      showNotification('Failed to update wishlist', 'error');
    }
  };

  // Load liked products from localStorage
  useEffect(() => {
    const savedLikes = localStorage.getItem('likedProducts');
    if (savedLikes) {
      try {
        const parsed = JSON.parse(savedLikes);
        const likesObj = {};
        if (Array.isArray(parsed)) {
          parsed.forEach(id => { likesObj[id] = true; });
        } else if (typeof parsed === 'object' && parsed !== null) {
          Object.assign(likesObj, parsed);
        }
        setLikedProducts(likesObj);
      } catch (err) {
        console.error('Failed to parse liked products:', err);
      }
    }
  }, []);

  // Show notification and auto-hide after 3 seconds
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle add to cart
  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock <= 0) {
      showNotification('This product is out of stock', 'error');
      return;
    }
    
    addToCart(product, 1);
    showNotification(`${product.name} added to cart!`, 'success');
  };

  // Handle open product modal
  const handleOpenProductModal = async (productId, e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalQuantity(1);
    try {
      const productData = await getProductById(productId);
      setModalProduct(productData);
    } catch (error) {
      showNotification('Failed to load product details', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setModalProduct(null);
    setModalQuantity(1);
  };

  // Handle add to cart from modal
  const handleModalAddToCart = () => {
    if (!modalProduct) return;
    
    if (modalProduct.stock < modalQuantity) {
      showNotification('Insufficient stock', 'error');
      return;
    }
    
    addToCart(modalProduct, modalQuantity);
    showNotification(`${modalProduct.name} added to cart!`, 'success');
    handleCloseModal();
  };

  // Filter products by price range on client side
  const filteredProducts = products.filter((product) => {
    const price = product.discount 
      ? product.price * (1 - product.discount / 100)
      : product.price;
    
    if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={filters.search ? `Search: ${filters.search}` : (filters.category ? `${filters.category} Products` : 'All Products')}
        description="Browse our wide range of quality products. Filter by category, price, and more."
        keywords="products, shop online, catalog, deals, South Africa"
        canonicalPath="/products"
      />
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className={`px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            <span className="font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-80"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-5 sm:mb-7">
          <h1 className="admin-page-title font-bold text-gray-900 mb-2 sm:mb-3">
            All Products
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {totalProducts} product{totalProducts !== 1 ? 's' : ''} found
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <FiFilter />
                <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`transition-all duration-300 ${showFilters ? 'md:w-64 block' : 'md:w-0 hidden'}`}>
            <Card className={`p-6 sticky top-20 transition-all duration-300 ${showFilters ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Default</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="-rating">Highest Rated</option>
                  <option value="-createdAt">Newest</option>
                </select>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))] gap-5 mb-8">
                  {filteredProducts.map((product) => {
                    const isLiked = likedProducts[product._id] || false;
                    
                    return (
                      <div 
                        key={product._id} 
                        className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 flex flex-col"
                      >
                        <div 
                          onClick={(e) => handleOpenProductModal(product._id, e)}
                          className="block relative overflow-hidden cursor-pointer"
                        >
                          {/* Image Container */}
                          <div className="relative w-full bg-gradient-to-br from-gray-100 to-gray-200 h-40 sm:h-48 md:h-52 lg:h-56">
                            {(product.images?.[0] || product.image) ? (
                              <img
                                src={product.images?.[0] || product.image}
                                alt={product.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                                <span className="text-gray-400 text-5xl font-bold">
                                  {product.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            
                            {/* Discount Badge */}
                            {product.discount > 0 && (
                              <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg z-10">
                                -{product.discount}%
                              </div>
                            )}
                            
                            {/* Stock Badge */}
                            <div className="absolute top-3 right-3 z-10">
                              {product.stock > 0 ? (
                                product.stock <= 5 && (
                                  <span className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                                    Only {product.stock} left
                                  </span>
                                )
                              ) : (
                                <span className="bg-gray-800 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                                  Out of Stock
                                </span>
                              )}
                            </div>

                            {/* Quick Actions - Show on hover */}
                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
                              <button 
                                onClick={(e) => handleAddToCart(product, e)}
                                disabled={product.stock <= 0}
                                className="bg-white text-blue-600 p-2.5 rounded-full shadow-lg hover:bg-blue-50 hover:text-blue-700 hover:shadow-xl transition-all duration-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-gray-300 disabled:hover:shadow-lg"
                                title={product.stock > 0 ? "Add to cart" : "Out of stock"}
                              >
                                <FiShoppingCart className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 
                            onClick={(e) => handleOpenProductModal(product._id, e)}
                            className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 text-sm leading-tight cursor-pointer"
                          >
                            {product.name}
                          </h3>
                          
                          {/* Rating */}
                          <div className="flex items-center mb-3">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <FiStar
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < Math.floor(product.rating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-1.5 text-xs text-gray-500 font-medium">
                              {product.rating.toFixed(1)}
                            </span>
                            <span className="ml-1 text-xs text-gray-400">
                              ({product.numReviews})
                            </span>
                          </div>

                          {/* Price */}
                          <div className="mb-3 mt-auto">
                            {product.discount > 0 ? (
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                                  R{formatPrice(product.price * (1 - product.discount / 100))}
                                </span>
                                <span className="text-sm text-gray-400 line-through">
                                  R{formatPrice(product.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                                R{formatPrice(product.price)}
                              </span>
                            )}
                          </div>

                          {/* Views and Likes Counter */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1.5">
                              <FiEye className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold text-gray-900">{(product.views || 0).toLocaleString()}</span>
                            </div>
                            <button 
                              onClick={(e) => handleToggleLike(product._id, e)}
                              className={`flex items-center gap-1.5 transition-all duration-200 group ${
                                isLiked
                                  ? 'text-red-500' 
                                  : 'text-gray-700 hover:text-red-500'
                              }`}
                              title={isLiked ? 'Unlike' : 'Add to wishlist'}
                            >
                              <FiHeart className={`w-4 h-4 ${
                                isLiked ? 'fill-current' : 'group-hover:fill-current'
                              }`} />
                              <span className="text-xs font-semibold">
                                {(product.likes || 0).toLocaleString()}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 border rounded-lg ${
                              page === currentPage
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No products found</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Quick View Modal */}
      {modalProduct && (
        <Modal 
          isOpen={!!modalProduct} 
          onClose={handleCloseModal}
          size="lg"
          title=""
        >
          <div className="max-h-[80vh] overflow-y-auto -mx-2 px-2">
            {modalLoading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-3">
                  <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100">
                    {(modalProduct.images?.[0] || modalProduct.image) ? (
                      <img
                        src={modalProduct.images?.[0] || modalProduct.image}
                        alt={modalProduct.name}
                        className="w-full h-full object-contain p-4"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-300 text-7xl font-bold">
                          {modalProduct.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {modalProduct.discount > 0 && (
                      <div className="absolute top-3 left-3 bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide">
                        {modalProduct.discount}% OFF
                      </div>
                    )}
                  </div>
                  {modalProduct.images && modalProduct.images.length > 1 && (
                    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                      {modalProduct.images.slice(0, 5).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${modalProduct.name} ${idx + 1}`}
                          className="w-14 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0 hover:border-gray-400 transition-colors cursor-pointer"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  {modalProduct.brand && (
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                      {modalProduct.brand}
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 leading-tight">{modalProduct.name}</h2>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(modalProduct.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {modalProduct.rating.toFixed(1)} ({modalProduct.numReviews})
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 mb-5">
                    <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                      R{formatPrice(modalProduct.discount > 0 ? modalProduct.price * (1 - modalProduct.discount / 100) : modalProduct.price)}
                    </span>
                    {modalProduct.discount > 0 && (
                      <span className="text-base text-gray-400 line-through">
                        R{formatPrice(modalProduct.price)}
                      </span>
                    )}
                  </div>

                  <div className="mb-5">
                    {modalProduct.stock > 0 ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        In Stock ({modalProduct.stock} available)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {modalProduct.description && (
                    <div className="mb-5 pb-5 border-b border-gray-100">
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">{modalProduct.description}</p>
                    </div>
                  )}

                  {(modalProduct.contactNumber || modalProduct.whatsappNumber) && (
                    <div className="mb-5 pb-5 border-b border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact</h4>
                      <div className="flex flex-wrap gap-2">
                        {modalProduct.contactNumber && (
                          <a
                            href={`tel:${modalProduct.contactNumber}`}
                            className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {modalProduct.contactNumber}
                          </a>
                        )}
                        {modalProduct.whatsappNumber && (
                          <a
                            href={`https://wa.me/${modalProduct.whatsappNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-gray-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {modalProduct.stock > 0 && (
                    <div className="mb-6">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Quantity
                      </label>
                      <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <FiMinus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={modalQuantity}
                          onChange={(e) => setModalQuantity(Math.max(1, Math.min(modalProduct.stock, parseInt(e.target.value) || 1)))}
                          className="w-14 text-center border-x border-gray-200 py-2 text-sm font-semibold text-gray-900 focus:outline-none bg-transparent"
                        />
                        <button
                          onClick={() => setModalQuantity(Math.min(modalProduct.stock, modalQuantity + 1))}
                          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={handleModalAddToCart}
                      disabled={modalProduct.stock === 0}
                      className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                    >
                      <FiShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                    <button 
                      onClick={(e) => handleToggleLike(modalProduct._id, e)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        likedProducts[modalProduct._id]
                          ? 'bg-red-50 text-red-500 border border-red-200'
                          : 'bg-gray-50 text-gray-400 border border-gray-200 hover:text-red-500 hover:bg-red-50 hover:border-red-200'
                      }`}
                      title={likedProducts[modalProduct._id] ? 'Unlike' : 'Add to wishlist'}
                    >
                      <FiHeart className={`w-5 h-5 ${
                        likedProducts[modalProduct._id] ? 'fill-current' : ''
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-5 pt-5 border-t border-gray-100">
                    <Link 
                      to={`/product/${modalProduct._id}`}
                      className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors underline underline-offset-4 decoration-gray-300 hover:decoration-gray-500"
                      onClick={handleCloseModal}
                    >
                      View full details
                    </Link>
                    <span className="text-gray-200">|</span>
                    <button
                      onClick={handleCloseModal}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProductList;
