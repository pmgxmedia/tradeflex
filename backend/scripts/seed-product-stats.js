import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const seedProductStats = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to update`);

    for (const product of products) {
      // Generate realistic views (100-5000)
      const baseViews = Math.floor(Math.random() * 4900) + 100;
      
      // Generate realistic likes (10-20% of views)
      const likePercentage = 0.1 + Math.random() * 0.1; // 10-20%
      const baseLikes = Math.floor(baseViews * likePercentage);

      // Update product with realistic stats
      product.views = product.views || baseViews;
      product.likes = product.likes || baseLikes;
      
      // Initialize tracking arrays if they don't exist
      if (!product.viewedBy) product.viewedBy = [];
      if (!product.likedBy) product.likedBy = [];

      await product.save();
      console.log(`Updated ${product.name}: ${product.views} views, ${product.likes} likes`);
    }

    console.log('✅ Product stats seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding product stats:', error);
    process.exit(1);
  }
};

seedProductStats();
