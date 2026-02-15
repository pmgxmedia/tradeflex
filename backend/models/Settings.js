import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    // General Settings
    siteName: {
      type: String,
      default: 'EStore',
    },
    siteEmail: {
      type: String,
      default: 'admin@estore.com',
    },
    currency: {
      type: String,
      default: 'ZAR',
    },
    timezone: {
      type: String,
      default: 'Africa/Johannesburg',
    },
    language: {
      type: String,
      default: 'English',
    },

    // Email Settings
    smtpHost: {
      type: String,
      default: '',
    },
    smtpPort: {
      type: Number,
      default: 587,
    },
    smtpUsername: {
      type: String,
      default: '',
    },
    smtpPassword: {
      type: String,
      default: '',
    },
    emailFromName: {
      type: String,
      default: 'EStore',
    },
    emailFromAddress: {
      type: String,
      default: 'noreply@estore.com',
    },

    // Payment Settings
    stripeEnabled: {
      type: Boolean,
      default: false,
    },
    stripePublishableKey: {
      type: String,
      default: '',
    },
    stripeSecretKey: {
      type: String,
      default: '',
    },
    paypalEnabled: {
      type: Boolean,
      default: false,
    },
    paypalClientId: {
      type: String,
      default: '',
    },
    paypalClientSecret: {
      type: String,
      default: '',
    },

    // Bank Details for EFT Payment
    bankName: {
      type: String,
      default: '',
    },
    bankAccountName: {
      type: String,
      default: '',
    },
    bankAccountNumber: {
      type: String,
      default: '',
    },
    bankBranchCode: {
      type: String,
      default: '',
    },
    bankAccountType: {
      type: String,
      default: '',
    },
    bankSwiftCode: {
      type: String,
      default: '',
    },
    bankReference: {
      type: String,
      default: '',
    },

    // Security Settings
    twoFactorAuth: {
      type: Boolean,
      default: false,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: 'We are currently performing maintenance. Please check back soon.',
    },

    // Notification Settings
    orderNotifications: {
      type: Boolean,
      default: true,
    },
    lowStockAlerts: {
      type: Boolean,
      default: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    reviewNotifications: {
      type: Boolean,
      default: true,
    },

    // Feature Toggles
    enableReviews: {
      type: Boolean,
      default: true,
    },
    enableWishlist: {
      type: Boolean,
      default: true,
    },
    enableGuestCheckout: {
      type: Boolean,
      default: true,
    },

    // SEO Settings
    metaTitle: {
      type: String,
      default: 'EStore - Your Online Shopping Destination',
    },
    metaDescription: {
      type: String,
      default: 'Shop the latest products at great prices',
    },
    metaKeywords: {
      type: String,
      default: 'ecommerce, online shopping, products',
    },

    // Social Media
    facebookUrl: {
      type: String,
      default: '',
    },
    twitterUrl: {
      type: String,
      default: '',
    },
    instagramUrl: {
      type: String,
      default: '',
    },
    linkedinUrl: {
      type: String,
      default: '',
    },

    // This ensures we only have one settings document
    singleton: {
      type: String,
      default: 'settings',
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
