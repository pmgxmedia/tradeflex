import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import { FiFileText, FiImage, FiVideo, FiLink, FiTrash2, FiPlus, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { getBanners, createBanner, updateBanner, deleteBanner, getHeroBanners, createHeroBanner, updateHeroBanner, deleteHeroBanner } from '../../services/api';

const AdminContent = () => {
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [activeTab, setActiveTab] = useState('banners');
  const [editingPage, setEditingPage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [banners, setBanners] = useState([]);
  const [heroBanners, setHeroBanners] = useState([]);

  const [pages, setPages] = useState([
    { id: 1, title: 'About Us', slug: 'about', content: 'Welcome to our store! We provide quality products at great prices.' },
    { id: 2, title: 'Privacy Policy', slug: 'privacy', content: 'Your privacy is important to us. This policy outlines how we collect and use your data.' },
    { id: 3, title: 'Terms of Service', slug: 'terms', content: 'By using our service, you agree to these terms and conditions.' },
  ]);

  const [mediaFiles, setMediaFiles] = useState([
    { id: 1, name: 'product-1.jpg', type: 'image', size: '245 KB', url: '/uploads/product-1.jpg' },
    { id: 2, name: 'banner-sale.png', type: 'image', size: '512 KB', url: '/uploads/banner-sale.png' },
  ]);

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  // Fetch banners on component mount
  useEffect(() => {
    if (activeTab === 'banners') {
      fetchBanners();
    } else if (activeTab === 'hero') {
      fetchHeroBanners();
    }
  }, [activeTab]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await getBanners();
      setBanners(data);
    } catch (error) {
      showAlert(error.message || 'Failed to fetch banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHeroBanners = async () => {
    try {
      setLoading(true);
      const data = await getHeroBanners();
      setHeroBanners(data);
    } catch (error) {
      showAlert(error.message || 'Failed to fetch hero banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBanner = (id, field, value) => {
    setBanners(banners.map(banner => 
      banner._id === id ? { ...banner, [field]: value } : banner
    ));
  };

  const handleSaveBanner = async (bannerId) => {
    try {
      setLoading(true);
      const banner = banners.find(b => b._id === bannerId);
      
      if (!banner.title || !banner.image) {
        showAlert('Please provide both title and image', 'error');
        return;
      }

      if (banner._id && !banner._id.toString().startsWith('temp-')) {
        // Update existing banner
        await updateBanner(banner._id, banner);
        showAlert(`Banner "${banner.title}" updated successfully`);
      } else {
        // Create new banner
        const newBanner = await createBanner({
          title: banner.title,
          subtitle: banner.subtitle || '',
          description: banner.description || '',
          image: banner.image,
          link: banner.link || '/products',
          buttonText: banner.buttonText || 'Shop Now',
          active: banner.active !== undefined ? banner.active : true,
          order: banner.order || 0,
          backgroundColor: banner.backgroundColor || '#1f2937',
          textColor: banner.textColor || '#ffffff',
        });
        // Replace temp banner with real one
        setBanners(banners.map(b => b._id === bannerId ? newBanner : b));
        showAlert(`Banner "${banner.title}" created successfully`);
      }
      
      fetchBanners(); // Refresh the list
    } catch (error) {
      showAlert(error.message || 'Failed to save banner', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      setLoading(true);
      
      // If it's a temporary banner, just remove from state
      if (id.toString().startsWith('temp-')) {
        setBanners(banners.filter(banner => banner._id !== id));
        showAlert('Banner removed', 'info');
      } else {
        // Delete from database
        await deleteBanner(id);
        setBanners(banners.filter(banner => banner._id !== id));
        showAlert('Banner deleted successfully', 'info');
      }
    } catch (error) {
      showAlert(error.message || 'Failed to delete banner', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBanner = () => {
    const tempId = `temp-${Date.now()}`;
    setBanners([...banners, { 
      _id: tempId,
      title: 'New Banner', 
      subtitle: '',
      description: '',
      image: '', 
      link: '/products',
      buttonText: 'Shop Now',
      active: false,
      order: banners.length,
      backgroundColor: '#1f2937',
      textColor: '#ffffff',
    }]);
    showAlert('New banner added - remember to save');
  };

  const handleImageUpload = async (bannerId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showAlert('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Image size must be less than 5MB', 'error');
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        handleUpdateBanner(bannerId, 'image', base64String);
        showAlert('Image uploaded successfully');
      };
      reader.onerror = () => {
        showAlert('Failed to read image file', 'error');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showAlert('Failed to upload image', 'error');
    }
  };

  // Hero Banner CRUD handlers
  const handleUpdateHeroBanner = (id, field, value) => {
    setHeroBanners(heroBanners.map(hero => 
      hero._id === id ? { ...hero, [field]: value } : hero
    ));
  };

  const handleUpdateHeroBannerNested = (id, section, field, value) => {
    setHeroBanners(heroBanners.map(hero => 
      hero._id === id ? { 
        ...hero, 
        [section]: { ...hero[section], [field]: value } 
      } : hero
    ));
  };

  const handleSaveHeroBanner = async (heroBannerId) => {
    try {
      setLoading(true);
      const heroBanner = heroBanners.find(h => h._id === heroBannerId);
      
      if (!heroBanner.heading?.mainText || !heroBanner.heroImage) {
        showAlert('Please provide heading text and hero image', 'error');
        return;
      }

      if (heroBanner._id && !heroBanner._id.toString().startsWith('temp-')) {
        // Update existing hero banner
        await updateHeroBanner(heroBanner._id, heroBanner);
        showAlert('Hero banner updated successfully');
      } else {
        // Create new hero banner
        const newHeroBanner = await createHeroBanner(heroBanner);
        setHeroBanners(heroBanners.map(h => h._id === heroBannerId ? newHeroBanner : h));
        showAlert('Hero banner created successfully');
      }
      
      fetchHeroBanners();
    } catch (error) {
      showAlert(error.message || 'Failed to save hero banner', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHeroBanner = async (id) => {
    if (!confirm('Are you sure you want to delete this hero banner?')) return;
    
    try {
      setLoading(true);
      
      if (id.toString().startsWith('temp-')) {
        setHeroBanners(heroBanners.filter(hero => hero._id !== id));
        showAlert('Hero banner removed', 'info');
      } else {
        await deleteHeroBanner(id);
        setHeroBanners(heroBanners.filter(hero => hero._id !== id));
        showAlert('Hero banner deleted successfully', 'info');
      }
    } catch (error) {
      showAlert(error.message || 'Failed to delete hero banner', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHeroBanner = () => {
    const tempId = `temp-${Date.now()}`;
    setHeroBanners([...heroBanners, { 
      _id: tempId,
      badge: {
        text: 'New Collection 2026',
        textColor: '#2563eb',
        backgroundColor: '#eff6ff',
      },
      heading: {
        mainText: 'Redefine Your',
        highlightedText: 'Lifestyle',
        gradientFrom: '#2563eb',
        gradientTo: '#9333ea',
      },
      description: 'Experience the perfect blend of style and functionality.',
      primaryButton: {
        text: 'Explore Now',
        link: '/products',
      },
      secondaryButton: {
        text: 'Trending',
        link: '/products?category=trending',
      },
      heroImage: '',
      backgroundColor: '#F9F7F4',
      active: false,
    }]);
    showAlert('New hero banner added - remember to save');
  };

  const handleHeroImageUpload = async (heroBannerId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert('Please select an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert('Image size must be less than 5MB', 'error');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        handleUpdateHeroBanner(heroBannerId, 'heroImage', base64String);
        showAlert('Hero image uploaded successfully');
      };
      reader.onerror = () => {
        showAlert('Failed to read image file', 'error');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showAlert('Failed to upload hero image', 'error');
    }
  };

  const handleEditPage = (page) => {
    setEditingPage({ ...page });
  };

  const handleUpdatePage = (field, value) => {
    setEditingPage({ ...editingPage, [field]: value });
  };

  const handleSavePage = () => {
    setPages(pages.map(page => 
      page.id === editingPage.id ? editingPage : page
    ));
    showAlert(`Page "${editingPage.title}" saved successfully`);
    setEditingPage(null);
  };

  const handleCancelEdit = () => {
    setEditingPage(null);
  };

  const handleAddPage = () => {
    const newId = Math.max(...pages.map(p => p.id), 0) + 1;
    const newPage = { 
      id: newId, 
      title: 'New Page', 
      slug: 'new-page', 
      content: '' 
    };
    setPages([...pages, newPage]);
    setEditingPage(newPage);
    showAlert('New page added');
  };

  const handleDeletePage = (id) => {
    setPages(pages.filter(page => page.id !== id));
    showAlert('Page deleted successfully', 'info');
  };

  const handleDeleteMedia = (id) => {
    setMediaFiles(mediaFiles.filter(file => file.id !== id));
    showAlert('Media file deleted successfully', 'info');
  };

  const handleMediaUpload = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).map((file, index) => ({
        id: Math.max(...mediaFiles.map(f => f.id), 0) + index + 1,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
        size: `${(file.size / 1024).toFixed(0)} KB`,
        url: URL.createObjectURL(file)
      }));
      setMediaFiles([...mediaFiles, ...newFiles]);
      showAlert(`${newFiles.length} file(s) uploaded successfully`);
    }
  };

  return (
    <div className="space-y-6">
      {alert.show && <Alert type={alert.type} message={alert.message} />}

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
        <p className="text-gray-600 mt-1">Manage banners, pages, and media content</p>
      </div>

      {/* Content Type Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'hero' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Hero Banner
        </button>
        <button 
          onClick={() => setActiveTab('banners')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'banners' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Promo Banners
        </button>
        <button 
          onClick={() => setActiveTab('pages')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'pages' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pages
        </button>
        <button 
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'media' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Media Library
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Hero Banner Management Tab */}
      {activeTab === 'hero' && !loading && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Manage Hero Banner</h3>
            <Button onClick={handleAddHeroBanner}>
              <FiPlus className="w-4 h-4 mr-2" />
              Add Hero Banner
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {heroBanners.map((hero) => (
              <Card key={hero._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Hero Banner</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      hero.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {hero.active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleDeleteHeroBanner(hero._id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete hero banner"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Badge Section */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Badge</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Badge Text"
                        value={hero.badge?.text || ''}
                        onChange={(e) => handleUpdateHeroBannerNested(hero._id, 'badge', 'text', e.target.value)}
                        placeholder="New Collection 2026"
                      />
                      <Input
                        label="Text Color"
                        type="text"
                        value={hero.badge?.textColor || '#2563eb'}
                        onChange={(e) => handleUpdateHeroBannerNested(hero._id, 'badge', 'textColor', e.target.value)}
                        placeholder="#2563eb"
                      />
                      <Input
                        label="Background Color"
                        type="text"
                        value={hero.badge?.backgroundColor || '#eff6ff'}
                        onChange={(e) => handleUpdateHeroBannerNested(hero._id, 'badge', 'backgroundColor', e.target.value)}
                        placeholder="#eff6ff"
                      />
                    </div>
                  </div>

                  {/* Heading Section */}
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Heading</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Main Text"
                        value={hero.heading?.mainText || ''}
                        onChange={(e) => handleUpdateHeroBannerNested(hero._id, 'heading', 'mainText', e.target.value)}
                        placeholder="Redefine Your"
                      />
                      <Input
                        label="Highlighted Text"
                        value={hero.heading?.highlightedText || ''}
                        onChange={(e) => handleUpdateHeroBannerNested(hero._id, 'heading', 'highlightedText', e.target.value)}
                        placeholder="Lifestyle"
                      />
                      <Input
                        label="Gradient From"
                        type="text"
                        value={hero.heading?.gradientFrom || '#2563eb'}
                        onChange={(e) => handleUpdateHeroBannerNested(hero._id, 'heading', 'gradientFrom', e.target.value)}
                        placeholder="#2563eb"
                      />
                      <Input
                        label="Gradient To"
                        type="text"
                        value={hero.heading?.gradientTo || '#9333ea'}
                        onChange={(e) => handleUpdateHeroBannerNested(hero._id, 'heading', 'gradientTo', e.target.value)}
                        placeholder="#9333ea"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={hero.description || ''}
                      onChange={(e) => handleUpdateHeroBanner(hero._id, 'description', e.target.value)}
                      placeholder="Experience the perfect blend of style and functionality..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Buttons Section */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Buttons</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        label="Primary Button Text"
                        value={hero.primaryButton?.text || ''}
                        onChange={(e) => handleUpdateHeroBannerNested(hero._id, 'primaryButton', 'text', e.target.value)}
                        placeholder="Explore Now"
                      />
                      <Input
                        label="Primary Button Link"
                        value={hero.primaryButton?.link || ''}
                        onChange={(e) => handleUpdateHeroBannerNested(hero._id, 'primaryButton', 'link', e.target.value)}
                        placeholder="/products"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Secondary Button Text"
                        value={hero.secondaryButton?.text || ''}
                        onChange={(e) => handleUpdateHeroBannerNested(hero._id, 'secondaryButton', 'text', e.target.value)}
                        placeholder="Trending"
                      />
                      <Input
                        label="Secondary Button Link"
                        value={hero.secondaryButton?.link || ''}
                        onChange={(e) => handleUpdateHeroBannerNested(hero._id, 'secondaryButton', 'link', e.target.value)}
                        placeholder="/products?category=trending"
                      />
                    </div>
                  </div>

                  {/* Hero Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hero Image
                    </label>
                    <input
                      type="file"
                      id={`hero-image-${hero._id}`}
                      accept="image/*"
                      onChange={(e) => handleHeroImageUpload(hero._id, e)}
                      className="hidden"
                    />
                    <label
                      htmlFor={`hero-image-${hero._id}`}
                      className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                    >
                      {hero.heroImage ? (
                        <div className="space-y-2">
                          <img src={hero.heroImage} alt="Preview" className="w-full h-60 object-cover rounded mx-auto" />
                          <p className="text-sm text-green-600 font-medium">Click to change image</p>
                        </div>
                      ) : (
                        <>
                          <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-600">Click to upload hero image</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                        </>
                      )}
                    </label>
                    <div className="mt-2">
                      <Input
                        placeholder="Or paste image URL here"
                        value={hero.heroImage && hero.heroImage.startsWith('data:') ? '' : (hero.heroImage || '')}
                        onChange={(e) => handleUpdateHeroBanner(hero._id, 'heroImage', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <Input
                    label="Section Background Color"
                    type="text"
                    value={hero.backgroundColor || '#F9F7F4'}
                    onChange={(e) => handleUpdateHeroBanner(hero._id, 'backgroundColor', e.target.value)}
                    placeholder="#F9F7F4"
                  />

                  {/* Active Toggle */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={hero.active || false}
                      onChange={(e) => handleUpdateHeroBanner(hero._id, 'active', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">Active</label>
                  </div>

                  {/* Save Button */}
                  <Button onClick={() => handleSaveHeroBanner(hero._id)} className="w-full">
                    <FiSave className="w-4 h-4 mr-2" />
                    Save Hero Banner
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Banner Management Tab */}
      {activeTab === 'banners' && !loading && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Manage Banners</h3>
            <Button onClick={handleAddBanner}>
              <FiPlus className="w-4 h-4 mr-2" />
              Add Banner
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {banners.map((banner) => (
              <Card key={banner._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{banner.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      banner.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {banner.active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleDeleteBanner(banner._id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete banner"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Input
                    label="Banner Title"
                    value={banner.title}
                    onChange={(e) => handleUpdateBanner(banner._id, 'title', e.target.value)}
                    placeholder="Enter banner title"
                  />

                  <Input
                    label="Subtitle (Optional)"
                    value={banner.subtitle || ''}
                    onChange={(e) => handleUpdateBanner(banner._id, 'subtitle', e.target.value)}
                    placeholder="Enter subtitle text"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={banner.description || ''}
                      onChange={(e) => handleUpdateBanner(banner._id, 'description', e.target.value)}
                      placeholder="Enter banner description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banner Image
                    </label>
                    <input
                      type="file"
                      id={`banner-image-${banner._id}`}
                      accept="image/*"
                      onChange={(e) => handleImageUpload(banner._id, e)}
                      className="hidden"
                    />
                    <label
                      htmlFor={`banner-image-${banner._id}`}
                      className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                    >
                      {banner.image ? (
                        <div className="space-y-2">
                          <img src={banner.image} alt="Preview" className="w-full h-40 object-cover rounded mx-auto" />
                          <p className="text-sm text-green-600 font-medium">Click to change image</p>
                        </div>
                      ) : (
                        <>
                          <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-600">Click to upload banner image</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                        </>
                      )}
                    </label>
                    <div className="mt-2">
                      <Input
                        placeholder="Or paste image URL here"
                        value={banner.image && banner.image.startsWith('data:') ? '' : (banner.image || '')}
                        onChange={(e) => handleUpdateBanner(banner._id, 'image', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <Input
                    label="Link URL"
                    value={banner.link || '/products'}
                    onChange={(e) => handleUpdateBanner(banner._id, 'link', e.target.value)}
                    placeholder="/products"
                    icon={FiLink}
                  />

                  <Input
                    label="Button Text"
                    value={banner.buttonText || 'Shop Now'}
                    onChange={(e) => handleUpdateBanner(banner._id, 'buttonText', e.target.value)}
                    placeholder="Shop Now"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Background Color"
                      type="text"
                      value={banner.backgroundColor || '#1f2937'}
                      onChange={(e) => handleUpdateBanner(banner._id, 'backgroundColor', e.target.value)}
                      placeholder="#1f2937"
                    />
                    <Input
                      label="Text Color"
                      type="text"
                      value={banner.textColor || '#ffffff'}
                      onChange={(e) => handleUpdateBanner(banner._id, 'textColor', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>

                  <Input
                    label="Display Order"
                    type="number"
                    value={banner.order || 0}
                    onChange={(e) => handleUpdateBanner(banner._id, 'order', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={banner.active}
                      onChange={(e) => handleUpdateBanner(banner._id, 'active', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">Active</label>
                  </div>

                  <Button onClick={() => handleSaveBanner(banner._id)} className="w-full">
                    <FiSave className="w-4 h-4 mr-2" />
                    Save Banner
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Pages Management Tab */}
      {activeTab === 'pages' && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Static Pages</h3>
            <Button onClick={handleAddPage}>
              <FiPlus className="w-4 h-4 mr-2" />
              Add Page
            </Button>
          </div>

          {editingPage ? (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Page: {editingPage.title}</h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Page Title"
                  value={editingPage.title}
                  onChange={(e) => handleUpdatePage('title', e.target.value)}
                  placeholder="Enter page title"
                />

                <Input
                  label="URL Slug"
                  value={editingPage.slug}
                  onChange={(e) => handleUpdatePage('slug', e.target.value)}
                  placeholder="page-url-slug"
                  helperText="This will be the page URL: /page/[slug]"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Content
                  </label>
                  <textarea
                    value={editingPage.content}
                    onChange={(e) => handleUpdatePage('content', e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter page content..."
                  />
                </div>

                <div className="flex space-x-3">
                  <Button onClick={handleSavePage} className="flex-1">
                    <FiSave className="w-4 h-4 mr-2" />
                    Save Page
                  </Button>
                  <Button variant="secondary" onClick={handleCancelEdit} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <Card key={page.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <FiFileText className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{page.title}</p>
                        <p className="text-sm text-gray-500">/page/{page.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleEditPage(page)}
                      >
                        <FiEdit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <button
                        onClick={() => handleDeletePage(page.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Delete page"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Media Library Tab */}
      {activeTab === 'media' && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Media Library</h3>
            <Button onClick={() => document.getElementById('media-upload').click()}>
              <FiPlus className="w-4 h-4 mr-2" />
              Upload Media
            </Button>
          </div>

          <Card className="p-6">
            <input
              type="file"
              id="media-upload"
              accept="image/*,video/*,.pdf"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />
            <label
              htmlFor="media-upload"
              className="block border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer mb-6"
            >
              <FiImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 font-medium mb-2">Upload Media Files</p>
              <p className="text-sm text-gray-500">Click to browse or drag and drop files here</p>
              <p className="text-xs text-gray-400 mt-2">Supported formats: JPG, PNG, GIF, MP4, PDF (Max 10MB)</p>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaFiles.map((file) => (
                <Card key={file.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        {file.type === 'image' ? (
                          <FiImage className="w-6 h-6 text-blue-600" />
                        ) : file.type === 'video' ? (
                          <FiVideo className="w-6 h-6 text-purple-600" />
                        ) : (
                          <FiFileText className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.size}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMedia(file.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete file"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {file.url}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiFileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pages</p>
              <p className="text-2xl font-bold text-gray-900">{pages.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiImage className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Banners</p>
              <p className="text-2xl font-bold text-gray-900">
                {banners.filter(b => b.active).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiVideo className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Media Files</p>
              <p className="text-2xl font-bold text-gray-900">{mediaFiles.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiLink className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Banners</p>
              <p className="text-2xl font-bold text-gray-900">{banners.length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminContent;
