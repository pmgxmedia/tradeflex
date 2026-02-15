import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();

  // Format price with thousand separators
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity > item.stock) {
      alert(`Only ${item.stock} items available in stock`);
      return;
    }
    updateQuantity(item._id, newQuantity, item.variant);
  };

  const subtotal = getCartTotal();
  const shipping = subtotal > 50 ? 0 : 10;
  const VAT_RATE = 0.15; // 15% South African VAT on items
  const vat = subtotal * VAT_RATE;
  const total = subtotal + shipping + vat;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to get started!</p>
          <Link to="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="admin-page-title font-bold text-gray-900 my-6">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card className="divide-y">
              {cartItems.map((item) => {
                const finalPrice = item.discount 
                  ? item.price * (1 - item.discount / 100)
                  : item.price;

                return (
                  <div key={`${item._id}-${JSON.stringify(item.variant)}`} className="p-6">
                    <div className="flex space-x-4">
                      {/* Product Image */}
                      <Link to={`/product/${item._id}`} className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                          {item.images?.[0] ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-400 text-2xl">
                                {item.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1">
                        <Link
                          to={`/product/${item._id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        
                        {item.variant && (
                          <p className="text-sm text-gray-600 mt-1">
                            Variant: {JSON.stringify(item.variant)}
                          </p>
                        )}

                        <div className="mt-2">
                          <span className="text-lg font-bold text-gray-900 tracking-tight">
                            R{formatPrice(finalPrice)}
                          </span>
                          {item.discount > 0 && (
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              R{formatPrice(item.price)}
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleQuantityChange(item, item.quantity - 1)}
                              className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                            >
                              <FiMinus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item, item.quantity + 1)}
                              className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                            >
                              <FiPlus className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item._id, item.variant)}
                            className="text-red-600 hover:text-red-700 flex items-center space-x-1"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 tracking-tight">
                          R{formatPrice(finalPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>

            {/* Clear Cart Button */}
            <div className="mt-4">
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm('Are you sure you want to clear the cart?')) {
                    clearCart();
                  }
                }}
              >
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-20">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span className="font-medium">R{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `R${formatPrice(shipping)}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>VAT (15%)</span>
                  <span className="font-medium">R{formatPrice(vat)}</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="tracking-tight">R{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {subtotal < 50 && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Add <span className="font-semibold">R{formatPrice(50 - subtotal)}</span> more to get FREE shipping!
                  </p>
                </div>
              )}

              <Button
                onClick={() => navigate('/checkout')}
                fullWidth
                size="lg"
              >
                Proceed to Checkout
              </Button>

              <Link to="/products">
                <Button variant="outline" fullWidth className="mt-3">
                  Continue Shopping
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
