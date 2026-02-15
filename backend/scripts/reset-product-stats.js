import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const resetProductStats = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to reset`);

    for (const product of products) {
      // Reset all stats to 0
      product.views = 0;
      product.likes = 0;
      product.viewedBy = [];
      product.likedBy = [];

      await product.save();
      console.log(`Reset stats for: ${product.name}`);
    }

    console.log('✅ Product stats reset successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting product stats:', error);
    process.exit(1);
  }
};

resetProductStats();
