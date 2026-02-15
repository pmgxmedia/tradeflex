import Product from '../models/Product.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const pageSize = 12;
    const page = Number(req.query.page) || 1;

    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: 'i',
          },
        }
      : {};

    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
      .populate('category', 'name')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const product = new Product({
      name: req.body.name || 'Sample name',
      description: req.body.description || 'Sample description',
      price: req.body.price || 0,
      category: req.body.category,
      brand: req.body.brand || '',
      stock: req.body.stock || 0,
      images: req.body.images || [],
      contactNumber: req.body.contactNumber || '',
      whatsappNumber: req.body.whatsappNumber || '',
      discount: req.body.discount ?? 0,
      isFeatured: req.body.isFeatured ?? false,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = req.body.name || product.name;
      product.description = req.body.description || product.description;
      product.price = req.body.price || product.price;
      product.category = req.body.category || product.category;
      product.brand = req.body.brand || product.brand;
      product.stock = req.body.stock ?? product.stock;
      product.images = req.body.images || product.images;
      product.contactNumber = req.body.contactNumber ?? product.contactNumber;
      product.whatsappNumber = req.body.whatsappNumber ?? product.whatsappNumber;
      product.isFeatured = req.body.isFeatured ?? product.isFeatured;
      product.discount = req.body.discount ?? product.discount;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        res.status(400).json({ message: 'Product already reviewed' });
        return;
      }

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Track product view
// @route   POST /api/products/:id/view
// @access  Public
export const trackProductView = async (req, res) => {
  try {
    const { deviceId } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required' });
    }

    // Check if this device has already viewed the product
    if (!product.viewedBy.includes(deviceId)) {
      product.viewedBy.push(deviceId);
      product.views = (product.views || 0) + 1;
      await product.save();
    }

    res.json({ 
      views: product.views,
      liked: product.likedBy.includes(deviceId),
      likes: product.likes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle product like
// @route   POST /api/products/:id/like
// @access  Public
export const toggleProductLike = async (req, res) => {
  try {
    const { deviceId } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required' });
    }

    // Check if this device has already liked the product
    const likeIndex = product.likedBy.indexOf(deviceId);
    
    if (likeIndex > -1) {
      // Unlike
      product.likedBy.splice(likeIndex, 1);
      product.likes = Math.max((product.likes || 0) - 1, 0);
    } else {
      // Like
      product.likedBy.push(deviceId);
      product.likes = (product.likes || 0) + 1;
    }

    await product.save();

    res.json({ 
      liked: likeIndex === -1,
      likes: product.likes,
      views: product.views
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
