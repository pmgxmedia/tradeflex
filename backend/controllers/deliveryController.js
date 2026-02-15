import Delivery from '../models/Delivery.js';
import DeliveryProvider from '../models/DeliveryProvider.js';
import Order from '../models/Order.js';

// @desc    Register a new delivery provider
// @route   POST /api/delivery/providers/register
// @access  Public
const registerProvider = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      address,
      bankDetails,
      documents
    } = req.body;

    // Check if provider already exists
    const existingProvider = await DeliveryProvider.findOne({ 
      $or: [{ email }, { vehicleNumber }] 
    });

    if (existingProvider) {
      return res.status(400).json({ 
        message: 'Provider with this email or vehicle number already exists' 
      });
    }

    const provider = await DeliveryProvider.create({
      name,
      email,
      phone,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      address,
      bankDetails,
      documents,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Provider registered successfully. Awaiting approval.',
      provider
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error registering provider', 
      error: error.message 
    });
  }
};

// @desc    Get all delivery providers (Admin)
// @route   GET /api/delivery/admin/providers
// @access  Private/Admin
const getAllProviders = async (req, res) => {
  try {
    const { status, availability } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (availability) filter.availability = availability;

    const providers = await DeliveryProvider.find(filter)
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      count: providers.length,
      providers
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching providers', 
      error: error.message 
    });
  }
};

// @desc    Approve or reject delivery provider (Admin)
// @route   PUT /api/delivery/admin/providers/:id/status
// @access  Private/Admin
const updateProviderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectedReason } = req.body;

    const provider = await DeliveryProvider.findById(id);

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    provider.status = status;
    
    if (status === 'approved') {
      provider.approvedBy = req.user._id;
      provider.approvedAt = new Date();
      provider.availability = 'available';
    } else if (status === 'rejected') {
      provider.rejectedReason = rejectedReason;
    }

    await provider.save();

    res.json({
      message: `Provider ${status} successfully`,
      provider
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating provider status', 
      error: error.message 
    });
  }
};

// @desc    Create delivery job (Admin)
// @route   POST /api/delivery/admin/jobs
// @access  Private/Admin
const createDeliveryJob = async (req, res) => {
  try {
    const {
      orderId,
      customer,
      pickupAddress,
      packageDetails,
      deliveryFee,
      priority,
      estimatedDeliveryTime
    } = req.body;

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const delivery = await Delivery.create({
      orderId,
      customer,
      pickupAddress,
      packageDetails,
      deliveryFee,
      priority: priority || 'normal',
      estimatedDeliveryTime,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Delivery job created successfully',
      delivery
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating delivery job', 
      error: error.message 
    });
  }
};

// @desc    Assign delivery to provider (Admin)
// @route   PUT /api/delivery/admin/jobs/:id/assign
// @access  Private/Admin
const assignDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { providerId } = req.body;

    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    const provider = await DeliveryProvider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (provider.status !== 'approved') {
      return res.status(400).json({ message: 'Provider is not approved' });
    }

    delivery.deliveryProvider = providerId;
    delivery.status = 'assigned';
    delivery.assignedAt = new Date();
    delivery.providerResponse = 'pending';
    
    delivery.notifications.push({
      type: 'assigned',
      sentAt: new Date(),
      read: false
    });

    await delivery.save();

    // Update provider stats
    provider.totalDeliveries += 1;
    await provider.save();

    res.json({
      message: 'Delivery assigned successfully',
      delivery
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error assigning delivery', 
      error: error.message 
    });
  }
};

// @desc    Get all deliveries (Admin)
// @route   GET /api/delivery/admin/jobs
// @access  Private/Admin
const getAllDeliveries = async (req, res) => {
  try {
    const { status, priority, providerId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (providerId) filter.deliveryProvider = providerId;

    const deliveries = await Delivery.find(filter)
      .sort({ createdAt: -1 })
      .populate('deliveryProvider', 'name phone vehicleType vehicleNumber')
      .populate('orderId', 'orderNumber totalAmount');

    res.json({
      success: true,
      count: deliveries.length,
      deliveries
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching deliveries', 
      error: error.message 
    });
  }
};

// @desc    Get available delivery jobs for provider
// @route   GET /api/delivery/provider/available-jobs
// @access  Private/Provider
const getAvailableJobs = async (req, res) => {
  try {
    const { providerId } = req.query;

    if (!providerId) {
      return res.status(400).json({ message: 'Provider ID required' });
    }

    // Get jobs that are assigned to this provider and pending response
    const jobs = await Delivery.find({
      deliveryProvider: providerId,
      providerResponse: 'pending',
      status: 'assigned'
    })
      .sort({ priority: -1, createdAt: 1 })
      .populate('orderId', 'orderNumber totalAmount');

    res.json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching available jobs', 
      error: error.message 
    });
  }
};

// @desc    Provider accepts or rejects delivery
// @route   PUT /api/delivery/provider/jobs/:id/respond
// @access  Private/Provider
const respondToDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, rejectionReason, providerId } = req.body;

    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Verify this delivery is assigned to this provider
    if (delivery.deliveryProvider.toString() !== providerId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    delivery.providerResponse = response;

    if (response === 'accepted') {
      delivery.status = 'accepted';
      delivery.acceptedAt = new Date();
      
      delivery.notifications.push({
        type: 'accepted',
        sentAt: new Date(),
        read: false
      });
    } else if (response === 'rejected') {
      delivery.status = 'pending';
      delivery.rejectionReason = rejectionReason;
      delivery.deliveryProvider = null;
      delivery.assignedAt = null;
      
      // Update provider stats
      const provider = await DeliveryProvider.findById(providerId);
      if (provider) {
        provider.totalDeliveries -= 1;
        await provider.save();
      }
    }

    await delivery.save();

    res.json({
      message: `Delivery ${response} successfully`,
      delivery
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error responding to delivery', 
      error: error.message 
    });
  }
};

// @desc    Update delivery status (Provider)
// @route   PUT /api/delivery/provider/jobs/:id/status
// @access  Private/Provider
const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, notes, providerId } = req.body;

    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Verify this delivery is assigned to this provider
    if (delivery.deliveryProvider.toString() !== providerId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Add tracking update
    await delivery.addTracking(status, location, notes);

    // Update timestamps based on status
    if (status === 'picked_up') {
      delivery.actualPickupTime = new Date();
    } else if (status === 'delivered') {
      delivery.actualDeliveryTime = new Date();
      
      // Update provider stats
      const provider = await DeliveryProvider.findById(providerId);
      if (provider) {
        provider.completedDeliveries += 1;
        await provider.save();
      }
    }

    delivery.notifications.push({
      type: 'status_update',
      sentAt: new Date(),
      read: false
    });

    await delivery.save();

    res.json({
      message: 'Delivery status updated successfully',
      delivery
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating delivery status', 
      error: error.message 
    });
  }
};

// @desc    Confirm delivery completion with proof
// @route   PUT /api/delivery/provider/jobs/:id/complete
// @access  Private/Provider
const completeDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { proofOfDelivery, providerId } = req.body;

    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Verify this delivery is assigned to this provider
    if (delivery.deliveryProvider.toString() !== providerId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    delivery.status = 'delivered';
    delivery.actualDeliveryTime = new Date();
    delivery.proofOfDelivery = proofOfDelivery;

    delivery.tracking.push({
      status: 'delivered',
      timestamp: new Date(),
      notes: 'Delivery completed'
    });

    delivery.notifications.push({
      type: 'delivered',
      sentAt: new Date(),
      read: false
    });

    await delivery.save();

    // Update provider stats and availability
    const provider = await DeliveryProvider.findById(providerId);
    if (provider) {
      provider.completedDeliveries += 1;
      provider.availability = 'available';
      await provider.save();
    }

    res.json({
      message: 'Delivery completed successfully',
      delivery
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error completing delivery', 
      error: error.message 
    });
  }
};

// @desc    Get provider's delivery history
// @route   GET /api/delivery/provider/:providerId/history
// @access  Private/Provider
const getProviderDeliveryHistory = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { status, limit = 50 } = req.query;

    const filter = { deliveryProvider: providerId };
    if (status) filter.status = status;

    const deliveries = await Delivery.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('orderId', 'orderNumber totalAmount');

    const provider = await DeliveryProvider.findById(providerId);

    res.json({
      success: true,
      provider: {
        name: provider.name,
        rating: provider.rating,
        totalDeliveries: provider.totalDeliveries,
        completedDeliveries: provider.completedDeliveries,
        successRate: provider.getSuccessRate()
      },
      count: deliveries.length,
      deliveries
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching delivery history', 
      error: error.message 
    });
  }
};

// @desc    Get delivery statistics (Admin)
// @route   GET /api/delivery/admin/statistics
// @access  Private/Admin
const getDeliveryStatistics = async (req, res) => {
  try {
    const totalProviders = await DeliveryProvider.countDocuments();
    const activeProviders = await DeliveryProvider.countDocuments({ 
      status: 'approved', 
      availability: { $in: ['available', 'busy'] } 
    });
    const pendingApprovals = await DeliveryProvider.countDocuments({ status: 'pending' });

    const totalDeliveries = await Delivery.countDocuments();
    const pendingDeliveries = await Delivery.countDocuments({ status: 'pending' });
    const inTransitDeliveries = await Delivery.countDocuments({ 
      status: { $in: ['assigned', 'accepted', 'picked_up', 'in_transit', 'out_for_delivery'] } 
    });
    const completedDeliveries = await Delivery.countDocuments({ status: 'delivered' });
    const failedDeliveries = await Delivery.countDocuments({ status: 'failed' });

    res.json({
      success: true,
      statistics: {
        providers: {
          total: totalProviders,
          active: activeProviders,
          pendingApprovals
        },
        deliveries: {
          total: totalDeliveries,
          pending: pendingDeliveries,
          inTransit: inTransitDeliveries,
          completed: completedDeliveries,
          failed: failedDeliveries,
          completionRate: totalDeliveries > 0 
            ? ((completedDeliveries / totalDeliveries) * 100).toFixed(2) 
            : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching statistics', 
      error: error.message 
    });
  }
};

// @desc    Update provider availability
// @route   PUT /api/delivery/provider/:id/availability
// @access  Private/Provider
const updateProviderAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    const provider = await DeliveryProvider.findById(id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    provider.availability = availability;
    await provider.save();

    res.json({
      message: 'Availability updated successfully',
      provider
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating availability', 
      error: error.message 
    });
  }
};

export {
  registerProvider,
  getAllProviders,
  updateProviderStatus,
  createDeliveryJob,
  assignDelivery,
  getAllDeliveries,
  getAvailableJobs,
  respondToDelivery,
  updateDeliveryStatus,
  completeDelivery,
  getProviderDeliveryHistory,
  getDeliveryStatistics,
  updateProviderAvailability
};
