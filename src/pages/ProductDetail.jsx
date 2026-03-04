import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, createProductReview, trackProductView, toggleProductLike } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
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
          <Button onClick={() => navigate('/products')}>Back to Products</Button>
        </div>
      </div>
    );
  }

  const finalPrice = product.discount 
    ? product.price * (1 - product.discount / 100)
    : product.price;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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
      {/* Back Button full-width row */}
      <div className="px-4 sm:px-6 lg:px-8 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
        >
          <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div>
            <Card className="mb-4">
              <div className="relative w-full max-w-md mx-auto bg-gray-200 flex items-center justify-center overflow-hidden h-64 md:h-80 max-h-80 rounded-xl">
                {product.images?.[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-6xl">{product.name.charAt(0)}</span>
                  </div>
                )}
                {product.discount > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-2 rounded-md font-semibold">
                    {product.discount}% OFF
                  </div>
                )}
              </div>
            </Card>
            
            {product.images && product.images.length > 0 && (
              <div className="mt-3 w-full flex flex-row flex-nowrap overflow-x-auto overflow-y-hidden space-x-3 pb-1">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 flex-shrink-0 border-2 rounded-lg overflow-hidden ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex items-center text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`}
                  />
                ))}
              </div>
              <span className="ml-2 text-gray-600">
                {product.rating.toFixed(1)} ({product.numReviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-4xl font-bold text-gray-900 tracking-tight">
                  R{formatPrice(finalPrice)}
                </span>
                {product.discount > 0 && (
                  <span className="text-1xl text-gray-500 line-through">
                    R{formatPrice(product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock > 0 ? (
                <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
            </div>

            {/* Brand */}
            {product.brand && (
              <div className="mb-6">
                <span className="text-gray-400 text-sm font-semibold">Brand: </span>
                <span className="text-sm font-bold">{product.brand}</span>
              </div>
            )}

            {/* Contact Information */}
            {(product.contactNumber || product.whatsappNumber) && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Contact Store</h3>
                <div className="space-y-2">
                  {product.contactNumber && (
                    <a
                      href={`tel:${product.contactNumber}`}
                      className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className="flex items-center text-green-600 hover:text-green-800 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      WhatsApp: {product.whatsappNumber}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-colors transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ background: '#2563eb', color: '#fff' }}
                  >
                    <span className="text-xl font-bold" style={{ color: '#fff' }}>-</span>
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                    className="w-14 sm:w-20 text-center border-2 border-blue-600 rounded-lg py-2 text-base font-bold text-blue-700 bg-blue-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-600"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-colors transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ background: '#2563eb', color: '#fff' }}
                  >
                    <span className="text-xl font-bold" style={{ color: '#fff' }}>+</span>
                  </button>
                </div>
              </div>
            )}

            {/* Views and Likes Stats */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FiEye className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">{(product.views || 0).toLocaleString()}</span>
                <span className="text-sm text-gray-600">views</span>
              </div>
              <div className="flex items-center gap-2">
                <FiHeart className={`w-5 h-5 ${isLiked ? 'fill-current text-red-500' : 'text-red-500'}`} />
                <span className="font-semibold text-gray-900">{(product.likes || 0).toLocaleString()}</span>
                <span className="text-sm text-gray-600">likes</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mb-6">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                fullWidth
                size="lg"
              >
                <FiShoppingCart />
                Add to Cart
              </Button>
              <button 
                onClick={handleLike}
                className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isLiked 
                    ? 'border-red-500 text-red-500 bg-red-50 shadow-md' 
                    : 'border-gray-400 text-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-50 hover:shadow-md'
                }`}
                title={isLiked ? 'Unlike' : 'Like this product'}
              >
                <FiHeart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Existing Reviews */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-4">
                {product.reviews.map((review, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{review.name}</span>
                      <div className="flex items-center text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'fill-current' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No reviews yet. Be the first to review!</p>
            )}
          </div>

          {/* Write Review */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Write a Review</h2>
            <Card className="p-6">
              <form onSubmit={handleReviewSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReview({ ...review, rating: star })}
                        className="focus:outline-none"
                      >
                        <FiStar
                          className={`w-8 h-8 ${
                            star <= review.rating
                              ? 'fill-current text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment
                  </label>
                  <textarea
                    value={review.comment}
                    onChange={(e) => setReview({ ...review, comment: e.target.value })}
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Share your experience with this product..."
                  />
                </div>

                <Button type="submit" loading={reviewLoading} fullWidth>
                  Submit Review
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
