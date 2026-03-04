import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, createProductReview, trackProductView, toggleProductLike } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import SEO from '../components/SEO';
import { FiStar, FiShoppingCart, FiHeart, FiEye, FiArrowLeft } from 'react-icons/fi';
import { getDeviceId, hasViewedProduct, markProductAsViewed, hasLikedProduct, toggleProductLikeLocal } from '../utils/deviceId';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { trackProductView: trackAnalyticsProductView } = useAnalytics();
  
  // Format price with thousand separators
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const data = await getProductById(id);
      setProduct(data);
      
      // Track view only once per device (for product stats)
      const deviceId = getDeviceId();
      if (!hasViewedProduct(id)) {
        const viewResult = await trackProductView(id, deviceId);
        setProduct(prev => ({ ...prev, views: viewResult.views, likes: viewResult.likes }));
        markProductAsViewed(id);
        setIsLiked(viewResult.liked);
      } else {
        setIsLiked(hasLikedProduct(id));
      }
      
      // Track view in analytics (for visitor analytics)
      trackAnalyticsProductView(id, data.name, data.category?.name || 'Uncategorized');
      
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const deviceId = getDeviceId();
      const result = await toggleProductLike(id, deviceId);
      
      setIsLiked(result.liked);
      toggleProductLikeLocal(id);
      setProduct(prev => ({ ...prev, likes: result.likes }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddToCart = () => {
    if (product.stock < quantity) {
      setAlert({ type: 'error', message: 'Insufficient stock' });
      return;
    }
    addToCart(product, quantity);
    setAlert({ type: 'success', message: 'Added to cart successfully!' });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setReviewLoading(true);
    try {
      await createProductReview(id, review);
      setAlert({ type: 'success', message: 'Review submitted successfully!' });
      setReview({ rating: 5, comment: '' });
      fetchProduct(); // Refresh product to show new review
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 rounded-xl font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all duration-200 text-sm"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const finalPrice = product.discount 
    ? product.price * (1 - product.discount / 100)
    : product.price;

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={product.name}
        description={product.description?.substring(0, 160) || `Buy ${product.name} at great prices.`}
        keywords={`${product.name}, ${product.category?.name || ''}, buy online, South Africa`}
        canonicalPath={`/product/${product._id}`}
        ogType="product"
        ogImage={product.images?.[0]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "description": product.description,
          "image": product.images?.[0],
          "offers": {
            "@type": "Offer",
            "price": finalPrice,
            "priceCurrency": "ZAR",
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          },
          ...(product.rating > 0 && {
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": product.rating,
              "reviewCount": product.numReviews || 1
            }
          })
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group mb-6 sm:mb-8"
        >
          <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {alert && (
          <div className="mb-6">
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 mb-16">
          <div className="flex flex-col gap-4">
            <div className="relative w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 aspect-square flex items-center justify-center">
              {product.images?.[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-contain p-6"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-300 text-8xl font-bold">{product.name.charAt(0)}</span>
                </div>
              )}
              {product.discount > 0 && (
                <div className="absolute top-4 left-4 bg-rose-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold tracking-wide">
                  {product.discount}% OFF
                </div>
              )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="flex flex-row flex-nowrap overflow-x-auto gap-3 pb-1">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === index ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {product.brand && (
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                {product.brand}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {product.rating.toFixed(1)} ({product.numReviews} reviews)
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-gray-100">
              <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                R{formatPrice(finalPrice)}
              </span>
              {product.discount > 0 && (
                <span className="text-lg text-gray-400 line-through">
                  R{formatPrice(product.price)}
                </span>
              )}
            </div>

            <div className="mb-6">
              {product.stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-semibold">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Out of Stock
                </span>
              )}
            </div>

            {product.description && (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {(product.contactNumber || product.whatsappNumber) && (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact Store</h3>
                <div className="flex flex-wrap gap-3">
                  {product.contactNumber && (
                    <a
                      href={`tel:${product.contactNumber}`}
                      className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {product.contactNumber}
                    </a>
                  )}
                  {product.whatsappNumber && (
                    <a
                      href={`https://wa.me/${product.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-gray-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      WhatsApp: {product.whatsappNumber}
                    </a>
                  )}
                </div>
              </div>
            )}

            {product.stock > 0 && (
              <div className="mb-8">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Quantity
                </label>
                <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-medium">−</span>
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                    className="w-16 text-center border-x border-gray-200 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none bg-transparent"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-medium">+</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-500">
                <FiEye className="w-4 h-4" />
                <span className="text-sm font-medium">{(product.views || 0).toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <FiHeart className={`w-4 h-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                <span className="text-sm font-medium">{(product.likes || 0).toLocaleString()} likes</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 py-3.5 px-8 rounded-xl font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-base"
              >
                <FiShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button 
                onClick={handleLike}
                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                  isLiked 
                    ? 'bg-red-50 text-red-500 border border-red-200' 
                    : 'bg-gray-50 text-gray-400 border border-gray-200 hover:text-red-500 hover:bg-red-50 hover:border-red-200'
                }`}
                title={isLiked ? 'Unlike' : 'Like this product'}
              >
                <FiHeart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 pt-10 border-t border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-4">
                {product.reviews.map((review, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-900 text-sm">{review.name}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <p className="text-gray-400 text-sm">No reviews yet. Be the first to review this product.</p>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Write a Review</h2>
            <div className="bg-gray-50 rounded-xl p-6">
              <form onSubmit={handleReviewSubmit}>
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Rating
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReview({ ...review, rating: star })}
                        className="focus:outline-none p-0.5"
                      >
                        <FiStar
                          className={`w-7 h-7 transition-colors ${
                            star <= review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Comment
                  </label>
                  <textarea
                    value={review.comment}
                    onChange={(e) => setReview({ ...review, comment: e.target.value })}
                    rows={4}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none bg-white text-sm transition-all resize-none"
                    placeholder="Share your experience with this product..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  {reviewLoading && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  Submit Review
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
