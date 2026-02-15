import mongoose from 'mongoose';

const heroBannerSchema = new mongoose.Schema(
  {
    badge: {
      text: {
        type: String,
        default: 'New Collection 2026',
      },
      textColor: {
        type: String,
        default: '#2563eb', // blue-600
      },
      backgroundColor: {
        type: String,
        default: '#eff6ff', // blue-50
      },
    },
    heading: {
      mainText: {
        type: String,
        required: [true, 'Main heading text is required'],
        default: 'Redefine Your',
      },
      highlightedText: {
        type: String,
        default: 'Lifestyle',
      },
      gradientFrom: {
        type: String,
        default: '#2563eb', // blue-600
      },
      gradientTo: {
        type: String,
        default: '#9333ea', // purple-600
      },
    },
    description: {
      type: String,
      default: 'Experience the perfect blend of style and functionality with our latest curated collection.',
    },
    primaryButton: {
      text: {
        type: String,
        default: 'Explore Now',
      },
      link: {
        type: String,
        default: '/products',
      },
    },
    secondaryButton: {
      text: {
        type: String,
        default: 'Trending',
      },
      link: {
        type: String,
        default: '/products?category=trending',
      },
    },
    heroImage: {
      type: String,
      required: [true, 'Hero image is required'],
      default: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000',
    },
    backgroundColor: {
      type: String,
      default: '#F9F7F4',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const HeroBanner = mongoose.model('HeroBanner', heroBannerSchema);

export default HeroBanner;
