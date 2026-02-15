import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Banner image is required'],
    },
    link: {
      type: String,
      default: '/products',
      trim: true,
    },
    buttonText: {
      type: String,
      default: 'Shop Now',
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    backgroundColor: {
      type: String,
      default: '#1f2937', // gray-900
    },
    textColor: {
      type: String,
      default: '#ffffff',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
bannerSchema.index({ active: 1, order: 1 });

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
