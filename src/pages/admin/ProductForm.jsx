import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct, updateProduct, getProductById, getCategories } from '../../services/api';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    stock: '',
    discount: '',
    images: '',
    contactNumber: '',
    whatsappNumber: '',
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const MAX_IMAGES = 8;
  const MAX_IMAGE_SIZE = { width: 1200, height: 1200 };
  const IMAGE_QUALITY = 0.8;

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const product = await getProductById(id);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category?._id || '',
        brand: product.brand || '',
        stock: product.stock || '',
        discount: product.discount || '',
        images: product.images?.join('\n') || '',
        contactNumber: product.contactNumber || '',
        whatsappNumber: product.whatsappNumber || '',
      });
      // Set existing images as previews
      if (product.images && product.images.length > 0) {
        setImagePreviews(product.images.map(url => ({ url, isExisting: true })));
      }
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const compressAndResizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_IMAGE_SIZE.width) {
              height = (height * MAX_IMAGE_SIZE.width) / width;
              width = MAX_IMAGE_SIZE.width;
            }
          } else {
            if (height > MAX_IMAGE_SIZE.height) {
              width = (width * MAX_IMAGE_SIZE.height) / height;
              height = MAX_IMAGE_SIZE.height;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
          resolve(compressedBase64);
        };

        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    const totalImages = imagePreviews.length + files.length;
    if (totalImages > MAX_IMAGES) {
      setAlert({ 
        type: 'error', 
        message: `Maximum ${MAX_IMAGES} images allowed. You can add ${MAX_IMAGES - imagePreviews.length} more image(s).` 
      });
      return;
    }

    setAlert({ type: 'info', message: 'Compressing and resizing images...' });

    try {
      // Compress and resize all images
      const compressedImages = await Promise.all(
        files.map(async (file) => {
          const compressed = await compressAndResizeImage(file);
          return {
            file,
            url: compressed,
            isExisting: false
          };
        })
      );

      setImageFiles(prev => [...prev, ...files]);
      setImagePreviews(prev => [...prev, ...compressedImages]);
      setAlert({ type: 'success', message: `${files.length} image(s) added successfully!` });
      
      // Clear success message after 2 seconds
      setTimeout(() => setAlert(null), 2000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to process images. Please try again.' });
    }
  };

  const removeImage = (index) => {
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });

    // Also remove from imageFiles if it's a new file
    setImageFiles(prev => {
      const preview = imagePreviews[index];
      if (preview.file) {
        return prev.filter(f => f !== preview.file);
      }
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      // Prepare product data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        discount: parseFloat(formData.discount) || 0,
      };

      // Handle images: combine existing URLs and new file uploads
      const existingImages = imagePreviews
        .filter(preview => preview.isExisting)
        .map(preview => preview.url);
      
      // Get newly uploaded images (already compressed)
      const newImages = imagePreviews
        .filter(preview => !preview.isExisting)
        .map(preview => preview.url);

      // Get URLs from textarea
      const urlImages = formData.images.split('\n').filter(url => url.trim());

      // Combine all images (existing + urls + new files)
      const allImages = [...existingImages, ...urlImages, ...newImages].filter(Boolean);

      // Enforce max image limit
      if (allImages.length > MAX_IMAGES) {
        setAlert({ 
          type: 'error', 
          message: `Maximum ${MAX_IMAGES} images allowed. Please remove ${allImages.length - MAX_IMAGES} image(s).` 
        });
        setSaving(false);
        return;
      }

      productData.images = allImages;

      if (isEditMode) {
        await updateProduct(id, productData);
        setAlert({ type: 'success', message: 'Product updated successfully!' });
      } else {
        await createProduct(productData);
        setAlert({ type: 'success', message: 'Product created successfully!' });
        setTimeout(() => navigate('/admin/products'), 2000);
      }
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="admin-page-title font-bold text-gray-900 mb-8">
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </h1>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Price"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                required
              />

              <Input
                label="Stock"
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
              />
            </div>

            <Input
              label="Discount (%)"
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contact Number"
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="+27 123 456 7890"
              />

              <Input
                label="WhatsApp Number"
                type="tel"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="+27 123 456 7890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images ({imagePreviews.length}/{MAX_IMAGES})
              </label>
              
              {/* Image Upload Input */}
              <div className="mb-4">
                <label className={`flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg transition-colors ${
                  imagePreviews.length >= MAX_IMAGES 
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                    : 'border-gray-300 cursor-pointer hover:border-blue-500'
                }`}>
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      {imagePreviews.length >= MAX_IMAGES ? (
                        <span className="text-gray-500">Maximum images reached</span>
                      ) : (
                        <>
                          <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {imagePreviews.length >= MAX_IMAGES 
                        ? `Remove images to add more (max ${MAX_IMAGES})`
                        : 'PNG, JPG, GIF - Auto-compressed to 1200x1200'
                      }
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFiles}
                    disabled={imagePreviews.length >= MAX_IMAGES}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {preview.isExisting && (
                        <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Existing
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Alternative: Image URLs */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter Image URLs (one per line)
                </label>
                <textarea
                  name="images"
                  value={formData.images}
                  onChange={handleChange}
                  rows={3}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Upload files above or enter URLs here
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/products')}
                fullWidth
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving} fullWidth>
                {isEditMode ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProductForm;
