import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createOrder } from '../services/api';
import { getSettings } from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { FiCreditCard, FiLock } from 'react-icons/fi';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  // Format price with thousand separators
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  
  const [fulfillmentMethod, setFulfillmentMethod] = useState('delivery');
  
  const [shippingInfo, setShippingInfo] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || '',
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const subtotal = getCartTotal();
  const shipping = fulfillmentMethod === 'collection' ? 0 : (subtotal > 50 ? 0 : 10);
  const VAT_RATE = 0.15; // South African VAT 15%
  const vat = subtotal * VAT_RATE;
  const total = subtotal + shipping + vat;

  // Fetch bank details from settings
  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        const settings = await getSettings();
        setBankDetails({
          bankName: settings.bankName,
          bankAccountName: settings.bankAccountName,
          bankAccountNumber: settings.bankAccountNumber,
          bankBranchCode: settings.bankBranchCode,
          bankAccountType: settings.bankAccountType,
          bankSwiftCode: settings.bankSwiftCode,
          bankReference: settings.bankReference,
        });
      } catch (error) {
        console.error('Failed to fetch bank details:', error);
      }
    };
    fetchBankDetails();
  }, []);

  if (!isAuthenticated) {
    navigate('/login', { state: { from: { pathname: '/checkout' } } });
    return null;
  }

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleShippingChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const handlePaymentChange = (e) => {
    setPaymentInfo({ ...paymentInfo, [e.target.name]: e.target.value });
  };

  const validateShipping = () => {
    if (fulfillmentMethod === 'collection') {
      return true; // Skip validation for collection
    }
    if (!shippingInfo.street || !shippingInfo.city || !shippingInfo.state || 
        !shippingInfo.zipCode || !shippingInfo.country) {
      setAlert({ type: 'error', message: 'Please fill in all shipping fields' });
      return false;
    }
    return true;
  };

  const validatePayment = () => {
    if (paymentMethod === 'card') {
      if (!paymentInfo.cardNumber || !paymentInfo.cardName || 
          !paymentInfo.expiryDate || !paymentInfo.cvv) {
        setAlert({ type: 'error', message: 'Please fill in all payment fields' });
        return false;
      }
      // Basic card number validation
      if (paymentInfo.cardNumber.replace(/\s/g, '').length < 13) {
        setAlert({ type: 'error', message: 'Invalid card number' });
        return false;
      }
    }
    // EFT, PayPal, and COD don't require validation at this step
    return true;
  };

  const handleContinue = () => {
    setAlert(null);
    if (step === 1 && validateShipping()) {
      setStep(2);
    } else if (step === 2 && validatePayment()) {
      setStep(3);
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setAlert(null);

    try {
      // Use default address for collection, actual address for delivery
      const addressToUse = fulfillmentMethod === 'collection' 
        ? { street: 'N/A', city: 'N/A', state: 'N/A', zipCode: 'N/A', country: 'N/A' }
        : shippingInfo;

      const orderData = {
        orderItems: cartItems.map(item => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          image: item.image || item.images?.[0] || '/placeholder.png',
          price: item.discount ? item.price * (1 - item.discount / 100) : item.price,
        })),
        fulfillmentMethod: fulfillmentMethod,
        shippingAddress: addressToUse,
        paymentMethod: paymentMethod,
        itemsPrice: subtotal,
        taxPrice: vat,
        shippingPrice: shipping,
        totalPrice: total,
      };

      const order = await createOrder(orderData);
      clearCart();
      navigate(`/order/${order._id}`, { state: { orderPlaced: true } });
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-20">
            <span className={`text-sm ${step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Shipping</span>
            <span className={`text-sm ${step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Payment</span>
            <span className={`text-sm ${step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Review</span>
          </div>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping */}
            {step === 1 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Fulfillment Method</h2>
                
                <div className="mb-6 space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="fulfillmentMethod"
                      value="delivery"
                      checked={fulfillmentMethod === 'delivery'}
                      onChange={(e) => setFulfillmentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Delivery</div>
                      <div className="text-sm text-gray-600">Have your order delivered to your address</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="fulfillmentMethod"
                      value="collection"
                      checked={fulfillmentMethod === 'collection'}
                      onChange={(e) => setFulfillmentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Collection</div>
                      <div className="text-sm text-gray-600">Pick up your order from our store</div>
                    </div>
                  </label>
                </div>

                {fulfillmentMethod === 'delivery' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
                    <div className="space-y-4">
                  <Input
                    label="Street Address"
                    name="street"
                    value={shippingInfo.street}
                    onChange={handleShippingChange}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="City"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleShippingChange}
                      required
                    />
                    <Input
                      label="State/Province"
                      name="state"
                      value={shippingInfo.state}
                      onChange={handleShippingChange}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="ZIP Code"
                      name="zipCode"
                      value={shippingInfo.zipCode}
                      onChange={handleShippingChange}
                      required
                    />
                    <Input
                      label="Country"
                      name="country"
                      value={shippingInfo.country}
                      onChange={handleShippingChange}
                      required
                    />
                  </div>
                    </div>
                  </div>
                )}

                {fulfillmentMethod === 'collection' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Collection Address</h3>
                    <p className="text-sm text-blue-800">
                      123 Main Street<br />
                      City Centre<br />
                      Business hours: Mon-Fri 9AM-5PM, Sat 9AM-2PM
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <Button onClick={handleContinue} fullWidth>Continue to Payment</Button>
                </div>
              </Card>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
                
                <div className="mb-6 space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="flex items-center space-x-2">
                      <FiCreditCard />
                      <span>Credit/Debit Card</span>
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="eft"
                      checked={paymentMethod === 'eft'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>EFT / Bank Transfer</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>PayPal</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Cash on Delivery</span>
                  </label>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-4 mb-6">
                    <Input
                      label="Card Number"
                      name="cardNumber"
                      value={paymentInfo.cardNumber}
                      onChange={handlePaymentChange}
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                    <Input
                      label="Cardholder Name"
                      name="cardName"
                      value={paymentInfo.cardName}
                      onChange={handlePaymentChange}
                      placeholder="John Doe"
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Expiry Date"
                        name="expiryDate"
                        value={paymentInfo.expiryDate}
                        onChange={handlePaymentChange}
                        placeholder="MM/YY"
                        required
                      />
                      <Input
                        label="CVV"
                        name="cvv"
                        value={paymentInfo.cvv}
                        onChange={handlePaymentChange}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'eft' && bankDetails && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-4 text-lg">Bank Transfer Details</h3>
                    <div className="space-y-3">
                      {bankDetails.bankName && (
                        <div className="flex justify-between border-b border-blue-200 pb-2">
                          <span className="text-sm font-medium text-blue-800">Bank Name:</span>
                          <span className="text-sm text-blue-900">{bankDetails.bankName}</span>
                        </div>
                      )}
                      {bankDetails.bankAccountName && (
                        <div className="flex justify-between border-b border-blue-200 pb-2">
                          <span className="text-sm font-medium text-blue-800">Account Name:</span>
                          <span className="text-sm text-blue-900">{bankDetails.bankAccountName}</span>
                        </div>
                      )}
                      {bankDetails.bankAccountNumber && (
                        <div className="flex justify-between border-b border-blue-200 pb-2">
                          <span className="text-sm font-medium text-blue-800">Account Number:</span>
                          <span className="text-sm text-blue-900 font-mono">{bankDetails.bankAccountNumber}</span>
                        </div>
                      )}
                      {bankDetails.bankBranchCode && (
                        <div className="flex justify-between border-b border-blue-200 pb-2">
                          <span className="text-sm font-medium text-blue-800">Branch Code:</span>
                          <span className="text-sm text-blue-900 font-mono">{bankDetails.bankBranchCode}</span>
                        </div>
                      )}
                      {bankDetails.bankAccountType && (
                        <div className="flex justify-between border-b border-blue-200 pb-2">
                          <span className="text-sm font-medium text-blue-800">Account Type:</span>
                          <span className="text-sm text-blue-900">{bankDetails.bankAccountType}</span>
                        </div>
                      )}
                      {bankDetails.bankSwiftCode && (
                        <div className="flex justify-between border-b border-blue-200 pb-2">
                          <span className="text-sm font-medium text-blue-800">SWIFT/BIC Code:</span>
                          <span className="text-sm text-blue-900 font-mono">{bankDetails.bankSwiftCode}</span>
                        </div>
                      )}
                      {bankDetails.bankReference && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-yellow-900 mb-1">Payment Reference:</p>
                          <p className="text-sm text-yellow-800">{bankDetails.bankReference}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 bg-white border border-blue-300 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        <strong>Important:</strong> Please make your payment and keep proof of payment. Your order will be processed once payment is confirmed.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center text-sm text-gray-600 mb-6">
                  <FiLock className="mr-2" />
                  <span>Your payment information is secure and encrypted</span>
                </div>

                <div className="flex space-x-4">
                  <Button variant="outline" onClick={() => setStep(1)} fullWidth>Back</Button>
                  <Button onClick={handleContinue} fullWidth>Continue to Review</Button>
                </div>
              </Card>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Review Order</h2>
                
                <div className="space-y-6 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Fulfillment Method</h3>
                    <p className="text-gray-600 text-sm capitalize">{fulfillmentMethod}</p>
                  </div>

                  {fulfillmentMethod === 'delivery' ? (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
                      <p className="text-gray-600 text-sm">
                        {shippingInfo.street}<br />
                        {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}<br />
                        {shippingInfo.country}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Collection Address</h3>
                      <p className="text-gray-600 text-sm">
                        123 Main Street<br />
                        City Centre<br />
                        Business hours: Mon-Fri 9AM-5PM, Sat 9AM-2PM
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
                    <p className="text-gray-600 text-sm">
                      {paymentMethod === 'card' && 'Credit/Debit Card'}
                      {paymentMethod === 'eft' && 'EFT / Bank Transfer'}
                      {paymentMethod === 'paypal' && 'PayPal'}
                      {paymentMethod === 'cod' && 'Cash on Delivery'}
                    </p>
                    {paymentMethod === 'eft' && (
                      <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-xs text-blue-800">
                          <strong>Note:</strong> Please transfer the total amount to the bank details provided and use your order number as reference.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
                    <div className="space-y-2">
                      {cartItems.map((item) => (
                        <div key={item._id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.name} × {item.quantity}</span>
                          <span className="text-gray-900 font-medium tracking-tight">
                            R{formatPrice((item.discount ? item.price * (1 - item.discount / 100) : item.price) * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button variant="outline" onClick={() => setStep(2)} fullWidth>Back</Button>
                  <Button onClick={handlePlaceOrder} loading={loading} fullWidth>
                    Place Order
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-20">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>R{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{fulfillmentMethod === 'collection' ? 'Collection' : 'Shipping'}</span>
                  <span>{shipping === 0 ? 'FREE' : `R${formatPrice(shipping)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT (15%)</span>
                  <span>R{formatPrice(vat)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="tracking-tight">R{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Items ({cartItems.length})</h3>
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0">
                        {item.images?.[0] && (
                          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover rounded" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
