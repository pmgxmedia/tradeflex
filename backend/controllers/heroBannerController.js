import HeroBanner from '../models/HeroBanner.js';

// @desc    Get all hero banners
// @route   GET /api/hero-banners
// @access  Public
export const getHeroBanners = async (req, res) => {
  try {
    const { active } = req.query;
    const query = {};

    if (active !== undefined) {
      query.active = active === 'true';
    }

    const heroBanners = await HeroBanner.find(query).sort({ createdAt: -1 });
    res.json(heroBanners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active hero banner
// @route   GET /api/hero-banners/active
// @access  Public
export const getActiveHeroBanner = async (req, res) => {
  try {
    const heroBanner = await HeroBanner.findOne({ active: true }).sort({ createdAt: -1 });
    
    if (heroBanner) {
      res.json(heroBanner);
    } else {
      res.status(404).json({ message: 'No active hero banner found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single hero banner
// @route   GET /api/hero-banners/:id
// @access  Public
export const getHeroBannerById = async (req, res) => {
  try {
    const heroBanner = await HeroBanner.findById(req.params.id);

    if (heroBanner) {
      res.json(heroBanner);
    } else {
      res.status(404).json({ message: 'Hero banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a hero banner
// @route   POST /api/hero-banners
// @access  Private/Admin
export const createHeroBanner = async (req, res) => {
  try {
    const heroBanner = await HeroBanner.create(req.body);
    res.status(201).json(heroBanner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a hero banner
// @route   PUT /api/hero-banners/:id
// @access  Private/Admin
export const updateHeroBanner = async (req, res) => {
  try {
    const heroBanner = await HeroBanner.findById(req.params.id);

    if (heroBanner) {
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== undefined) {
          heroBanner[key] = req.body[key];
        }
      });

      const updatedHeroBanner = await heroBanner.save();
      res.json(updatedHeroBanner);
    } else {
      res.status(404).json({ message: 'Hero banner not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a hero banner
// @route   DELETE /api/hero-banners/:id
// @access  Private/Admin
export const deleteHeroBanner = async (req, res) => {
  try {
    const heroBanner = await HeroBanner.findById(req.params.id);

    if (heroBanner) {
      await heroBanner.deleteOne();
      res.json({ message: 'Hero banner removed' });
    } else {
      res.status(404).json({ message: 'Hero banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
