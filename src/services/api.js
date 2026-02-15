// Use Vite proxy in development, or configured URL in production
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to handle API errors
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
};

// ============= AUTH ENDPOINTS =============
export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const registerUser = async (name, email, password) => {
  const response = await fetch(`${API_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const logoutUser = async () => {
  const response = await fetch(`${API_URL}/users/logout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const getUserProfile = async () => {
  const response = await fetch(`${API_URL}/users/profile`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const updateUserProfile = async (userData) => {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ============= PRODUCT ENDPOINTS =============
export const getProducts = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/products${queryString ? `?${queryString}` : ''}`);
  return handleResponse(response);
};

export const getProductById = async (id) => {
  const response = await fetch(`${API_URL}/products/${id}`);
  return handleResponse(response);
};

export const createProduct = async (productData) => {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const updateProduct = async (id, productData) => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const trackProductView = async (id, deviceId) => {
  const response = await fetch(`${API_URL}/products/${id}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId }),
  });
  return handleResponse(response);
};

export const toggleProductLike = async (id, deviceId) => {
  const response = await fetch(`${API_URL}/products/${id}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId }),
  });
  return handleResponse(response);
};

export const deleteProduct = async (id) => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const createProductReview = async (id, review) => {
  const response = await fetch(`${API_URL}/products/${id}/reviews`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(review),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ============= CATEGORY ENDPOINTS =============
export const getCategories = async () => {
  const response = await fetch(`${API_URL}/categories`);
  return handleResponse(response);
};

export const getCategoryById = async (id) => {
  const response = await fetch(`${API_URL}/categories/${id}`);
  return handleResponse(response);
};

export const createCategory = async (categoryData) => {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoryData),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const updateCategory = async (id, categoryData) => {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoryData),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const deleteCategory = async (id) => {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ============= ORDER ENDPOINTS =============
export const createOrder = async (orderData) => {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(orderData),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const getMyOrders = async () => {
  const response = await fetch(`${API_URL}/orders/myorders`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const getOrderById = async (id) => {
  const response = await fetch(`${API_URL}/orders/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const getAllOrders = async () => {
  const response = await fetch(`${API_URL}/orders`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const updateOrderToPaid = async (id, paymentResult) => {
  const response = await fetch(`${API_URL}/orders/${id}/pay`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(paymentResult),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const updateOrderToDelivered = async (id) => {
  const response = await fetch(`${API_URL}/orders/${id}/deliver`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const updateOrderStatus = async (id, status, cancellationData = {}) => {
  const response = await fetch(`${API_URL}/orders/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, ...cancellationData }),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const cancelOrder = async (id, reason) => {
  const response = await fetch(`${API_URL}/orders/${id}/cancel`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const confirmCODPayment = async (id, status) => {
  const response = await fetch(`${API_URL}/orders/${id}/cod-confirm`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const uploadEFTProof = async (id, proofUrl) => {
  const response = await fetch(`${API_URL}/orders/${id}/eft-proof`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ proofUrl }),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const verifyEFTProof = async (id, verified) => {
  const response = await fetch(`${API_URL}/orders/${id}/eft-verify`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ verified }),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const sendPaymentConfirmationEmail = async (id) => {
  const response = await fetch(`${API_URL}/orders/${id}/send-confirmation`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const exportOrderReceipt = (id) => {
  const token = localStorage.getItem('token');
  window.open(`${API_URL}/orders/${id}/export?token=${token}`, '_blank');
};

export const exportAllOrdersCSV = () => {
  const token = localStorage.getItem('token');
  window.open(`${API_URL}/orders/export/csv?token=${token}`, '_blank');
};

export const exportPaidOrdersCSV = () => {
  const token = localStorage.getItem('token');
  window.open(`${API_URL}/orders/export/paid-csv?token=${token}`, '_blank');
};

// ============= ADMIN USER ENDPOINTS =============
export const getAllUsers = async () => {
  const response = await fetch(`${API_URL}/users`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const deleteUser = async (id) => {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ============= SETTINGS ENDPOINTS =============
export const getSettings = async () => {
  const response = await fetch(`${API_URL}/settings`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const updateSettings = async (settings) => {
  const response = await fetch(`${API_URL}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const updateSettingSection = async (section, data) => {
  const response = await fetch(`${API_URL}/settings/${section}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const resetSettings = async () => {
  const response = await fetch(`${API_URL}/settings/reset`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ============= BANNER ENDPOINTS =============
export const getBanners = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/banners${queryString ? `?${queryString}` : ''}`);
  return handleResponse(response);
};

export const getActiveBanners = async () => {
  const response = await fetch(`${API_URL}/banners/active`);
  return handleResponse(response);
};

export const getBannerById = async (id) => {
  const response = await fetch(`${API_URL}/banners/${id}`);
  return handleResponse(response);
};

export const createBanner = async (bannerData) => {
  const response = await fetch(`${API_URL}/banners`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(bannerData),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const updateBanner = async (id, bannerData) => {
  const response = await fetch(`${API_URL}/banners/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(bannerData),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const deleteBanner = async (id) => {
  const response = await fetch(`${API_URL}/banners/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ============= HERO BANNER ENDPOINTS =============
export const getHeroBanners = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/hero-banners${queryString ? `?${queryString}` : ''}`);
  return handleResponse(response);
};

export const getActiveHeroBanner = async () => {
  const response = await fetch(`${API_URL}/hero-banners/active`);
  return handleResponse(response);
};

export const getHeroBannerById = async (id) => {
  const response = await fetch(`${API_URL}/hero-banners/${id}`);
  return handleResponse(response);
};

export const createHeroBanner = async (heroBannerData) => {
  const response = await fetch(`${API_URL}/hero-banners`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(heroBannerData),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const updateHeroBanner = async (id, heroBannerData) => {
  const response = await fetch(`${API_URL}/hero-banners/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(heroBannerData),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const deleteHeroBanner = async (id) => {
  const response = await fetch(`${API_URL}/hero-banners/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ============= ANALYTICS ENDPOINTS =============
export const getVisitorStats = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/analytics/stats${queryString ? `?${queryString}` : ''}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const getPopularContent = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/analytics/popular${queryString ? `?${queryString}` : ''}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const getUserInterests = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/analytics/interests${queryString ? `?${queryString}` : ''}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const getTimeSpentAnalysis = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/analytics/timespent${queryString ? `?${queryString}` : ''}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

export const getActiveSessions = async () => {
  const response = await fetch(`${API_URL}/analytics/active`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// Legacy compatibility
export const testConnection = async () => {
  try {
    const response = await fetch('http://localhost:5000/');
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Axios-like API for delivery components
const api = {
  get: async (url, config = {}) => {
    // Build query string from params
    let fullUrl = `${API_URL}${url}`;
    if (config.params) {
      const queryString = new URLSearchParams(config.params).toString();
      fullUrl = `${fullUrl}${queryString ? '?' + queryString : ''}`;
    }
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        ...(config.headers || {})
      },
      credentials: 'include',
    });
    const data = await handleResponse(response);
    return { data };
  },
  
  post: async (url, data, config = {}) => {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        ...(config.headers || {})
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    const responseData = await handleResponse(response);
    return { data: responseData };
  },
  
  put: async (url, data, config = {}) => {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        ...(config.headers || {})
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    const responseData = await handleResponse(response);
    return { data: responseData };
  },
  
  delete: async (url, config = {}) => {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        ...(config.headers || {})
      },
      credentials: 'include',
    });
    const data = await handleResponse(response);
    return { data };
  }
};

export default api;
