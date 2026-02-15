// Generate or retrieve a unique device ID for tracking views and likes
export const getDeviceId = () => {
  const DEVICE_ID_KEY = 'device_id';
  
  // Check if device ID already exists
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    // Generate a new unique device ID
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
};

// Track viewed products
export const hasViewedProduct = (productId) => {
  const viewedProducts = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
  return viewedProducts.includes(productId);
};

export const markProductAsViewed = (productId) => {
  const viewedProducts = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
  if (!viewedProducts.includes(productId)) {
    viewedProducts.push(productId);
    localStorage.setItem('viewedProducts', JSON.stringify(viewedProducts));
  }
};

// Track liked products
export const hasLikedProduct = (productId) => {
  const likedProducts = JSON.parse(localStorage.getItem('likedProducts') || '[]');
  return likedProducts.includes(productId);
};

export const toggleProductLikeLocal = (productId) => {
  const likedProducts = JSON.parse(localStorage.getItem('likedProducts') || '[]');
  const index = likedProducts.indexOf(productId);
  
  if (index > -1) {
    likedProducts.splice(index, 1);
  } else {
    likedProducts.push(productId);
  }
  
  localStorage.setItem('likedProducts', JSON.stringify(likedProducts));
  return index === -1; // Return true if liked, false if unliked
};
