import Settings from '../models/Settings.js';

// @desc    Get all settings
// @route   GET /api/settings
// @access  Public (some fields may be restricted)
export const getSettings = async (req, res) => {
  try {
    console.log('Getting settings...');
    let settings = await Settings.findOne({ singleton: 'settings' });

    // Create default settings if none exist
    if (!settings) {
      console.log('No settings found, creating defaults...');
      settings = await Settings.create({ singleton: 'settings' });
    }

    // If not admin, hide sensitive data
    const isAdmin = req.user && req.user.isAdmin;
    console.log('User is admin:', isAdmin);
    
    if (!isAdmin) {
      const publicSettings = {
        siteName: settings.siteName,
        currency: settings.currency,
        timezone: settings.timezone,
        language: settings.language,
        enableReviews: settings.enableReviews,
        enableWishlist: settings.enableWishlist,
        enableGuestCheckout: settings.enableGuestCheckout,
        metaTitle: settings.metaTitle,
        metaDescription: settings.metaDescription,
        metaKeywords: settings.metaKeywords,
        facebookUrl: settings.facebookUrl,
        twitterUrl: settings.twitterUrl,
        instagramUrl: settings.instagramUrl,
        linkedinUrl: settings.linkedinUrl,
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,

        // Public EFT / bank transfer details for checkout
        bankName: settings.bankName,
        bankAccountName: settings.bankAccountName,
        bankAccountNumber: settings.bankAccountNumber,
        bankBranchCode: settings.bankBranchCode,
        bankAccountType: settings.bankAccountType,
        bankSwiftCode: settings.bankSwiftCode,
        bankReference: settings.bankReference,
      };
      return res.json(publicSettings);
    }

    console.log('Returning all settings to admin');
    // Convert to plain object to ensure proper serialization
    res.json(settings.toObject());
  } catch (error) {
    console.error('Error in getSettings:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
  try {
    console.log('Updating all settings:', req.body);
    let settings = await Settings.findOne({ singleton: 'settings' });

    if (!settings) {
      console.log('Creating new settings with provided data');
      settings = await Settings.create({ singleton: 'settings', ...req.body });
    } else {
      // Update all provided fields
      Object.keys(req.body).forEach((key) => {
        if (key !== 'singleton' && key !== '_id') {
          settings[key] = req.body[key];
        }
      });
      await settings.save();
      console.log('Settings updated successfully');
    }

    res.json({
      message: 'Settings updated successfully',
      settings: settings.toObject(),
    });
  } catch (error) {
    console.error('Error in updateSettings:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update specific setting section
// @route   PATCH /api/settings/:section
// @access  Private/Admin
export const updateSettingSection = async (req, res) => {
  try {
    const { section } = req.params;
    console.log(`Updating ${section} settings:`, req.body);
    let settings = await Settings.findOne({ singleton: 'settings' });

    if (!settings) {
      console.log('No settings found, creating defaults...');
      settings = await Settings.create({ singleton: 'settings' });
    }

    // Define which fields belong to which section
    const sectionFields = {
      general: ['siteName', 'siteEmail', 'currency', 'timezone', 'language'],
      email: ['smtpHost', 'smtpPort', 'smtpUsername', 'smtpPassword', 'emailFromName', 'emailFromAddress'],
      payment: ['stripeEnabled', 'stripePublishableKey', 'stripeSecretKey', 'paypalEnabled', 'paypalClientId', 'paypalClientSecret'],
      security: ['twoFactorAuth', 'maintenanceMode', 'maintenanceMessage'],
      notifications: ['orderNotifications', 'lowStockAlerts', 'lowStockThreshold', 'reviewNotifications'],
      features: ['enableReviews', 'enableWishlist', 'enableGuestCheckout'],
      seo: ['metaTitle', 'metaDescription', 'metaKeywords'],
      social: ['facebookUrl', 'twitterUrl', 'instagramUrl', 'linkedinUrl'],
    };

    const allowedFields = sectionFields[section];
    if (!allowedFields) {
      console.error('Invalid section:', section);
      return res.status(400).json({ message: 'Invalid settings section' });
    }

    // Update only fields from this section
    let updatedCount = 0;
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        settings[key] = req.body[key];
        updatedCount++;
      }
    });

    console.log(`Updated ${updatedCount} fields in ${section} section`);
    await settings.save();

    res.json({
      message: `${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully`,
      settings: settings.toObject(),
    });
  } catch (error) {
    console.error('Error in updateSettingSection:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset settings to defaults
// @route   POST /api/settings/reset
// @access  Private/Admin
export const resetSettings = async (req, res) => {
  try {
    console.log('Resetting settings to defaults...');
    await Settings.deleteOne({ singleton: 'settings' });
    const settings = await Settings.create({ singleton: 'settings' });
    console.log('Settings reset successfully');

    res.json({
      message: 'Settings reset to defaults',
      settings: settings.toObject(),
    });
  } catch (error) {
    console.error('Error in resetSettings:', error);
    res.status(500).json({ message: error.message });
  }
};
