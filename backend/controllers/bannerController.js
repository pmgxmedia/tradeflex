import Banner from '../models/Banner.js';

// @desc    Get all banners
// @route   GET /api/banners
// @access  Public
export const getBanners = async (req, res) => {
  try {
    const { active } = req.query;
    const query = {};

    // Filter by active status if provided
    if (active !== undefined) {
      query.active = active === 'true';
    }

    // Get current date for date filtering
    const now = new Date();

    const banners = await Banner.find(query)
      .sort({ order: 1, createdAt: -1 });

    // Filter by date range if dates are set
    const filteredBanners = banners.filter(banner => {
      if (banner.startDate && banner.startDate > now) return false;
      if (banner.endDate && banner.endDate < now) return false;
      return true;
    });

    res.json(filteredBanners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active banners for public display
// @route   GET /api/banners/active
// @access  Public
export const getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    
    const banners = await Banner.find({ active: true })
      .sort({ order: 1, createdAt: -1 });

    // Filter by date range
    const activeBanners = banners.filter(banner => {
      if (banner.startDate && banner.startDate > now) return false;
      if (banner.endDate && banner.endDate < now) return false;
      return true;
    });

    res.json(activeBanners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single banner
// @route   GET /api/banners/:id
// @access  Public
export const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (banner) {
      res.json(banner);
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private/Admin
export const createBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      image,
      link,
      buttonText,
      active,
      startDate,
      endDate,
      order,
      backgroundColor,
      textColor,
    } = req.body;

    const banner = await Banner.create({
      title,
      subtitle,
      description,
      image,
      link,
      buttonText,
      active,
      startDate,
      endDate,
      order,
      backgroundColor,
      textColor,
    });

    res.status(201).json(banner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
export const updateBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      image,
      link,
      buttonText,
      active,
      startDate,
      endDate,
      order,
      backgroundColor,
      textColor,
    } = req.body;

    const banner = await Banner.findById(req.params.id);

    if (banner) {
      banner.title = title || banner.title;
      banner.subtitle = subtitle !== undefined ? subtitle : banner.subtitle;
      banner.description = description !== undefined ? description : banner.description;
      banner.image = image || banner.image;
      banner.link = link || banner.link;
      banner.buttonText = buttonText || banner.buttonText;
      banner.active = active !== undefined ? active : banner.active;
      banner.startDate = startDate !== undefined ? startDate : banner.startDate;
      banner.endDate = endDate !== undefined ? endDate : banner.endDate;
      banner.order = order !== undefined ? order : banner.order;
      banner.backgroundColor = backgroundColor || banner.backgroundColor;
      banner.textColor = textColor || banner.textColor;

      const updatedBanner = await banner.save();
      res.json(updatedBanner);
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (banner) {
      await banner.deleteOne();
      res.json({ message: 'Banner removed' });
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
