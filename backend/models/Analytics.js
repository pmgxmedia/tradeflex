import mongoose from 'mongoose';

const pageViewSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const productViewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const analyticsSchema = new mongoose.Schema(
  {
    // Session identifier (unique per visit)
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    // User information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isRegistered: {
      type: Boolean,
      default: false,
    },
    
    // Device/Browser info
    deviceId: {
      type: String,
      index: true,
    },
    userAgent: {
      type: String,
    },
    
    // Visit information
    startTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    
    // Page views during this session
    pageViews: [pageViewSchema],
    totalPages: {
      type: Number,
      default: 0,
    },
    
    // Product views during this session
    productViews: [productViewSchema],
    
    // Categories viewed
    categoriesViewed: [{
      type: String,
    }],
    
    // Common interests (most viewed products/categories)
    interests: {
      topProducts: [{
        productId: mongoose.Schema.Types.ObjectId,
        productName: String,
        viewCount: Number,
      }],
      topCategories: [{
        category: String,
        viewCount: Number,
      }],
    },
    
    // Entry and exit pages
    entryPage: {
      type: String,
    },
    exitPage: {
      type: String,
    },
    
    // Referrer information
    referrer: {
      type: String,
    },
    
    // Session status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
analyticsSchema.index({ startTime: -1, isRegistered: 1 });
analyticsSchema.index({ userId: 1, startTime: -1 });
analyticsSchema.index({ deviceId: 1, startTime: -1 });

// Method to calculate duration
analyticsSchema.methods.calculateDuration = function() {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  return this.duration;
};

// Method to add page view
analyticsSchema.methods.addPageView = function(page) {
  this.pageViews.push({ page, timestamp: new Date() });
  this.totalPages = this.pageViews.length;
  if (this.pageViews.length === 1) {
    this.entryPage = page;
  }
  this.exitPage = page;
};

// Method to add product view
analyticsSchema.methods.addProductView = function(productId, productName, category) {
  this.productViews.push({ 
    productId, 
    productName, 
    category,
    timestamp: new Date() 
  });
  
  // Add category to categoriesViewed if not already present
  if (category && !this.categoriesViewed.includes(category)) {
    this.categoriesViewed.push(category);
  }
  
  // Update interests
  this.updateInterests();
};

// Method to update interests based on views
analyticsSchema.methods.updateInterests = function() {
  // Count product views
  const productCounts = {};
  this.productViews.forEach(view => {
    const key = view.productId.toString();
    if (!productCounts[key]) {
      productCounts[key] = {
        productId: view.productId,
        productName: view.productName,
        viewCount: 0,
      };
    }
    productCounts[key].viewCount++;
  });
  
  // Count category views
  const categoryCounts = {};
  this.productViews.forEach(view => {
    if (view.category) {
      if (!categoryCounts[view.category]) {
        categoryCounts[view.category] = {
          category: view.category,
          viewCount: 0,
        };
      }
      categoryCounts[view.category].viewCount++;
    }
  });
  
  // Sort and store top products
  this.interests.topProducts = Object.values(productCounts)
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 10);
  
  // Sort and store top categories
  this.interests.topCategories = Object.values(categoryCounts)
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);
};

// Static method to get visitor statistics
analyticsSchema.statics.getVisitorStats = async function(startDate, endDate) {
  const match = {
    startTime: {
      $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      $lte: endDate || new Date(),
    },
  };
  
  const [totalVisits, registeredVisits, avgDuration, totalPageViews] = await Promise.all([
    this.countDocuments(match),
    this.countDocuments({ ...match, isRegistered: true }),
    this.aggregate([
      { $match: match },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
    ]),
    this.aggregate([
      { $match: match },
      { $group: { _id: null, totalPages: { $sum: '$totalPages' } } },
    ]),
  ]);
  
  return {
    totalVisits,
    registeredVisits,
    guestVisits: totalVisits - registeredVisits,
    avgDuration: avgDuration[0]?.avgDuration || 0,
    totalPageViews: totalPageViews[0]?.totalPages || 0,
    avgPagesPerVisit: totalVisits > 0 ? (totalPageViews[0]?.totalPages || 0) / totalVisits : 0,
  };
};

// Static method to get popular content
analyticsSchema.statics.getPopularContent = async function(startDate, endDate, limit = 10) {
  const match = {
    startTime: {
      $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      $lte: endDate || new Date(),
    },
  };
  
  const [popularProducts, popularCategories, popularPages] = await Promise.all([
    // Most viewed products
    this.aggregate([
      { $match: match },
      { $unwind: '$productViews' },
      { 
        $group: { 
          _id: '$productViews.productId',
          productName: { $first: '$productViews.productName' },
          category: { $first: '$productViews.category' },
          views: { $sum: 1 },
        } 
      },
      { $sort: { views: -1 } },
      { $limit: limit },
    ]),
    
    // Most viewed categories
    this.aggregate([
      { $match: match },
      { $unwind: '$categoriesViewed' },
      { 
        $group: { 
          _id: '$categoriesViewed',
          views: { $sum: 1 },
        } 
      },
      { $sort: { views: -1 } },
      { $limit: limit },
    ]),
    
    // Most viewed pages
    this.aggregate([
      { $match: match },
      { $unwind: '$pageViews' },
      { 
        $group: { 
          _id: '$pageViews.page',
          views: { $sum: 1 },
        } 
      },
      { $sort: { views: -1 } },
      { $limit: limit },
    ]),
  ]);
  
  return {
    popularProducts,
    popularCategories,
    popularPages,
  };
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
