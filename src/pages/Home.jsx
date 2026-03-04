import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories, getActiveBanners, getActiveHeroBanner, toggleProductLike } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import SEO from '../components/SEO';
import { FiArrowRight, FiStar, FiTruck, FiCreditCard, FiShield, FiEye, FiHeart, FiShoppingCart } from 'react-icons/fi';
import { getDeviceId, hasLikedProduct, toggleProductLikeLocal } from '../utils/deviceId';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [heroBanner, setHeroBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likedProducts, setLikedProducts] = useState({});

  // Format price with thousand separators
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching home page data...');
        const [productsData, categoriesData, bannersData, heroBannerData] = await Promise.all([
          getProducts({ limit: 8, sort: '-rating' }),
          getCategories(),
          getActiveBanners(),
          getActiveHeroBanner().catch(() => null),
        ]);
        
        console.log('Products data:', productsData);
        console.log('Categories data:', categoriesData);
        console.log('Banners data:', bannersData);
        console.log('Hero banner data:', heroBannerData);
        
        setFeaturedProducts(productsData.products || []);
        setCategories(categoriesData || []);
        setBanners(bannersData || []);
        setHeroBanner(heroBannerData);
        
        // Initialize liked products state
        const initialLikes = {};
        (productsData.products || []).forEach(product => {
          initialLikes[product._id] = hasLikedProduct(product._id);
        });
        setLikedProducts(initialLikes);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set empty arrays so the page still renders
        setFeaturedProducts([]);
        setCategories([]);
        setBanners([]);
        setHeroBanner(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLike = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const deviceId = getDeviceId();
      const result = await toggleProductLike(productId, deviceId);
      
      // Update local state
      setLikedProducts(prev => ({ ...prev, [productId]: result.liked }));
      toggleProductLikeLocal(productId);
      
      // Update the product in the list
      setFeaturedProducts(prev => prev.map(p => 
        p._id === productId ? { ...p, likes: result.likes } : p
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO
        canonicalPath="/"
        keywords="ecommerce, online shopping, products, deals, shop, South Africa"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "EStore",
          "url": window.location.origin,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${window.location.origin}/products?search={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        }}
      />
      {/* Hero Section - Dynamic from Database */}
      {heroBanner ? (
        <section
          className="relative overflow-hidden"
          style={{ backgroundColor: heroBanner.backgroundColor }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -right-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-40" />
            <div className="absolute -bottom-40 -left-10 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-30" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16 md:py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-center">
              {/* Image / Visual */}
              <div className="order-1 md:order-2 flex justify-center md:justify-end">
                <div className="relative z-0 group w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-[2rem] transform rotate-3 transition-transform group-hover:rotate-1" />
                  <img
                    src={
                      heroBanner.heroImage ||
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000'
                    }
                    alt={heroBanner.heading?.mainText || 'Modern Product'}
                    className="relative z-10 w-full h-64 sm:h-80 md:h-[460px] lg:h-[500px] object-cover rounded-2xl shadow-2xl transition-transform group-hover:scale-[1.02]"
                  />
                </div>
              </div>

              {/* Text Content */}
              <div className="order-2 md:order-1 relative z-10 text-center md:text-left">
                <span
                  className="inline-block px-3 sm:px-4 py-1.5 mb-4 sm:mb-6 text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-full"
                  style={{
                    color: heroBanner.badge?.textColor || '#2563eb',
                    backgroundColor: heroBanner.badge?.backgroundColor || '#eff6ff',
                  }}
                >
                  {heroBanner.badge?.text || 'New Collection 2026'}
                </span>
                <h1 className="home-hero-heading text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-tight mb-3 sm:mb-5">
                  {heroBanner.heading?.mainText || 'Redefine Your'}{' '}
                  <br className="hidden sm:block" />
                  <span
                    className="text-transparent bg-clip-text"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${
                        heroBanner.heading?.gradientFrom || '#2563eb'
                      }, ${heroBanner.heading?.gradientTo || '#9333ea'})`,
                    }}
                  >
                    {heroBanner.heading?.highlightedText || 'Lifestyle'}
                  </span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-10 max-w-xl mx-auto md:mx-0 leading-relaxed">
                  {heroBanner.description ||
                    'Experience the perfect blend of style and functionality with our latest curated collection.'}
                </p>
                <div className="flex flex-col sm:flex-row items-center sm:items-stretch justify-center md:justify-start gap-3 sm:gap-4">
                  <Link to={heroBanner.primaryButton?.link || '/products'} className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 shadow-lg shadow-blue-200"
                    >
                      {heroBanner.primaryButton?.text || 'Explore Now'}{' '}
                      <FiArrowRight className="ml-2" />
                    </Button>
                  </Link>
                  <Link
                    to={heroBanner.secondaryButton?.link || '/products?category=trending'}
                    className="w-full sm:w-auto"
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4"
                    >
                      {heroBanner.secondaryButton?.text || 'Trending'}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden bg-[#F9F7F4]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -right-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-40" />
            <div className="absolute -bottom-40 -left-10 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-30" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16 md:py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-center">
              {/* Image / Visual */}
              <div className="order-1 md:order-2 flex justify-center md:justify-end">
                <div className="relative z-0 group w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-[2rem] transform rotate-3 transition-transform group-hover:rotate-1" />
                  <img
                    src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000"
                    alt="Modern Product"
                    className="relative z-10 w-full h-64 sm:h-80 md:h-[460px] lg:h-[500px] object-cover rounded-2xl shadow-2xl transition-transform group-hover:scale-[1.02]"
                  />
                </div>
              </div>

              {/* Text Content */}
              <div className="order-2 md:order-1 relative z-10 text-center md:text-left">
                <span className="inline-block px-3 sm:px-4 py-1.5 mb-4 sm:mb-6 text-xs sm:text-sm font-semibold tracking-wider text-blue-600 uppercase bg-blue-50 rounded-full">
                  
                </span>
                <h1 className="home-hero-heading text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-tight mb-3 sm:mb-5">
                  Redefine Your <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Lifestyle
                  </span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-10 max-w-xl mx-auto md:mx-0 leading-relaxed">
                  Experience the perfect blend of style and functionality with our latest curated collection.
                </p>
                <div className="flex flex-col sm:flex-row items-center sm:items-stretch justify-center md:justify-start gap-3 sm:gap-4">
                  <Link to="/products" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 shadow-lg shadow-blue-200"
                    >
                      Explore Now <FiArrowRight className="ml-2" />
                    </Button>
                  </Link>
                  <Link to="/products?category=trending" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4"
                    >
                      Trending
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Shop by Category */}
      {categories.length > 0 && (
        <section className="py-10 sm:py-14 md:py-16 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <h2 className="home-hero-heading text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 md:mb-0">Shop by Category</h2>
              <Link to="/products" className="text-blue-600 font-semibold flex items-center justify-center md:justify-start hover:underline transition-colors">
                View All Categories <FiArrowRight className="ml-2" />
              </Link>
            </div>
            
            {/* Horizontal scrollable slider for categories - mobile optimized */}
            <div className="relative">
              <div className="overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth">
                <div className="flex gap-3 pb-2 min-w-max sm:min-w-0 sm:flex-wrap">
                  {categories.slice(0, 6).map((category, index) => {
                    // Define gradient colors for each category
                    const gradients = [
                      'from-blue-500 to-indigo-600',
                      'from-purple-500 to-pink-600',
                      'from-green-500 to-teal-600',
                      'from-orange-500 to-red-600',
                      'from-cyan-500 to-blue-600',
                      'from-rose-500 to-purple-600'
                    ];
                    const gradient = gradients[index % gradients.length];
                    
                    return (
                      <Link
                        key={category._id}
                        to={`/products?category=${category._id}`}
                        className="group relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex-shrink-0"
                      >
                        {/* Background gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}></div>
                        
                        {/* Content */}
                        <div className="relative px-4 py-2.5 flex items-center gap-2">
                          <FiShoppingCart className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-sm font-semibold text-white whitespace-nowrap">
                            {category.name}
                          </span>
                          <FiArrowRight className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 transition-transform duration-300" />
                        </div>
                        
                        {/* Shine effect on hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <h2 className="home-hero-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">Weekly Trending</h2>
            <Link to="/products">
              <Button variant="outline" className="rounded-full">
                View All <FiArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {featuredProducts.length > 0 ? featuredProducts.map((product) => {
              const isLiked = likedProducts[product._id] || false;
              
              return (
                <div 
                  key={product._id} 
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 flex flex-col"
                >
                  <Link to={`/product/${product._id}`} className="block relative overflow-hidden">
                    {/* Image Container - match All Products styling */}
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Add to cart logic here
                          }}
                          className="bg-white text-blue-600 p-2.5 rounded-full shadow-lg hover:bg-blue-50 hover:text-blue-700 hover:shadow-xl transition-colors duration-200"
                          title="Add to cart"
                        >
                          <FiShoppingCart className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    <Link to={`/product/${product._id}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 text-sm leading-tight">
                        {product.name}
                      </h3>
                    </Link>
                    
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
                          <span className="text-xl font-bold text-gray-900 tracking-tight">
                            R{formatPrice(product.price * (1 - product.discount / 100))}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            R{formatPrice(product.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-gray-900 tracking-tight">
                          R{formatPrice(product.price)}
                        </span>
                      )}
                    </div>

                    {/* Views and Likes Counter */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-gray-500">
                        <FiEye className="w-4 h-4" />
                        <span className="text-xs font-medium">{(product.views || 0).toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={(e) => handleLike(e, product._id)}
                        className={`flex items-center gap-1 transition-colors duration-200 ${
                          isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <FiHeart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="text-xs font-medium">{(product.likes || 0).toLocaleString()}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }) : (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm animate-pulse">
                  <div className="h-40 sm:h-48 md:h-52 lg:h-56 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Promo Banner - Dynamic from Database */}
      {banners.length > 0 && banners.map((banner) => (
        <section key={banner._id} className="py-8 sm:py-10 md:py-14 px-6 sm:px-8 lg:px-12">
          <div
            className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative min-h-[220px] md:min-h-[280px] p-6 sm:p-8 md:p-10"
            style={{ backgroundColor: banner.backgroundColor }}
          >
            <div className="absolute inset-0 opacity-70">
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-contain animate-[zoom_20s_ease-in-out_infinite_alternate]"
                style={{
                  animation: 'zoom 20s ease-in-out infinite alternate'
                }}
              />
            </div>
            {/* Dark overlay for better text readability - limited to bottom half for a lighter, more refined feel */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>

            <div className="relative z-10 max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-6 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-10">
              <div className="flex-1 space-y-3 md:space-y-4 text-left">
                {banner.subtitle && (
                  <span
                    className="inline-flex items-center rounded-full border border-white/40 bg-black/10 backdrop-blur px-4 py-1 text-xs md:text-sm font-medium tracking-wide uppercase"
                    style={{ color: banner.textColor }}
                  >
                    {banner.subtitle}
                  </span>
                )}
                <h2
                  className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight drop-shadow-lg"
                  style={{ color: banner.textColor }}
                >
                  {banner.title}
                </h2>
                {banner.description && (
                  <p
                    className="text-sm md:text-base lg:text-lg max-w-xl drop-shadow-md text-white/90"
                    style={{ color: banner.textColor, opacity: 0.9 }}
                  >
                    {banner.description}
                  </p>
                )}
                <div className="pt-3 md:pt-4">
                  <Link to={banner.link}>
                    <Button
                      size="lg"
                      className="bg-white/95 text-gray-900 hover:bg-white hover:scale-105 transition-all px-8 md:px-10 py-3 rounded-2xl font-semibold shadow-lg shadow-black/20"
                    >
                      {banner.buttonText || 'Shop Now'}
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="hidden md:flex flex-none">
                <div className="rounded-2xl bg-white/90 backdrop-blur shadow-2xl shadow-black/30 px-6 py-5 min-w-[200px] max-w-xs flex flex-col gap-3">
                  <p className="text-xs font-semibold tracking-[0.18em] text-gray-500 uppercase">Featured Pick</p>
                  <p className="text-base font-semibold text-gray-900 break-words leading-relaxed">{banner.title}</p>
                  {banner.description && (
                    <p className="text-xs text-gray-500 break-words leading-relaxed">{banner.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-3 py-1">Just in</span>
                    <span className="text-xs text-gray-400">Explore collection</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Default Promo Banner - Shows if no active banners */}
      {banners.length === 0 && (
        <section className="py-12 sm:py-16 md:py-20 px-6 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden bg-gray-900 relative">
            <div className="absolute inset-0 opacity-40">
              <img 
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80" 
                alt="Promotion"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative z-10 px-8 sm:px-10 md:px-12 py-14 md:py-20 text-center">
              <h2 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 sm:mb-8 leading-tight">
                Summer Flash Sale <br /> Up to 60% Off
              </h2>
              <p className="text-gray-300 text-base sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-2xl mx-auto">
                Our biggest sale of the season is here. Discover premium quality at unbeatable prices for a limited time only.
              </p>
              <Link to="/products?discount=true">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 hover:scale-105 transition-all px-12 py-4 rounded-2xl font-bold">
                  Shop the Sale
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
