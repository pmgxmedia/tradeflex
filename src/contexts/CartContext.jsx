import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.error('Failed to parse cart from localStorage:', err);
      localStorage.removeItem('cart');
    }
    return [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1, variant = null) => {
    try {
      setCartItems((prevItems) => {
        // Create a safe version of the variant for comparison
        const variantKey = variant ? JSON.stringify(variant) : null;
        
        const existingItem = prevItems.find(
          (item) => {
            const itemVariantKey = item.variant ? JSON.stringify(item.variant) : null;
            return item._id === product._id && itemVariantKey === variantKey;
          }
        );

        if (existingItem) {
          return prevItems.map((item) => {
            const itemVariantKey = item.variant ? JSON.stringify(item.variant) : null;
            return item._id === product._id && itemVariantKey === variantKey
              ? { ...item, quantity: item.quantity + quantity }
              : item;
          });
        }

        // Create a clean product object without circular references
        const cleanProduct = {
          _id: product._id,
          name: product.name,
          price: product.price,
          discount: product.discount,
          image: product.images?.[0] || product.image,
          stock: product.stock,
          category: product.category,
        };

        return [...prevItems, { ...cleanProduct, quantity, variant }];
      });
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw new Error('Failed to add item to cart');
    }
  };

  const removeFromCart = (productId, variant = null) => {
    try {
      setCartItems((prevItems) => {
        const variantKey = variant ? JSON.stringify(variant) : null;
        return prevItems.filter((item) => {
          const itemVariantKey = item.variant ? JSON.stringify(item.variant) : null;
          return !(item._id === productId && itemVariantKey === variantKey);
        });
      });
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  const updateQuantity = (productId, quantity, variant = null) => {
    try {
      if (quantity <= 0) {
        removeFromCart(productId, variant);
        return;
      }

      setCartItems((prevItems) => {
        const variantKey = variant ? JSON.stringify(variant) : null;
        return prevItems.map((item) => {
          const itemVariantKey = item.variant ? JSON.stringify(item.variant) : null;
          return item._id === productId && itemVariantKey === variantKey
            ? { ...item, quantity }
            : item;
        });
      });
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.discount ? item.price * (1 - item.discount / 100) : item.price;
      return total + price * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
