import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendPaymentConfirmationEmail, sendOrderStatusEmail } from '../utils/emailService.js';
import { generateOrderReceiptHTML, generateOrderCSV } from '../utils/pdfGenerator.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      fulfillmentMethod,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const order = new Order({
      orderItems,
      user: req.user._id,
      fulfillmentMethod,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };
      order.status = 'processing';

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm or deny COD payment
// @route   PUT /api/orders/:id/cod-confirm
// @access  Private/Admin
export const confirmCODPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentMethod !== 'cod') {
      return res.status(400).json({ message: 'This order is not a COD payment' });
    }

    const { status } = req.body; // 'received' or 'denied'

    if (!['received', 'denied'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "received" or "denied"' });
    }

    order.codPaymentStatus = status;
    order.codConfirmedBy = req.user._id;
    order.codConfirmedAt = Date.now();

    if (status === 'received') {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = 'processing';
    } else if (status === 'denied') {
      order.status = 'cancelled';
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload EFT proof of payment
// @route   PUT /api/orders/:id/eft-proof
// @access  Private
export const uploadEFTProof = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentMethod !== 'eft') {
      return res.status(400).json({ message: 'This order is not an EFT payment' });
    }

    const { proofUrl } = req.body;

    if (!proofUrl) {
      return res.status(400).json({ message: 'Proof of payment URL is required' });
    }

    order.paymentProof = {
      url: proofUrl,
      uploadedAt: Date.now(),
      verified: false,
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify EFT proof of payment
// @route   PUT /api/orders/:id/eft-verify
// @access  Private/Admin
export const verifyEFTProof = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentMethod !== 'eft') {
      return res.status(400).json({ message: 'This order is not an EFT payment' });
    }

    if (!order.paymentProof || !order.paymentProof.url) {
      return res.status(400).json({ message: 'No proof of payment found for this order' });
    }

    const { verified } = req.body;

    order.paymentProof.verified = verified;
    order.paymentProof.verifiedBy = req.user._id;
    order.paymentProof.verifiedAt = Date.now();

    if (verified) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = 'processing';
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.status = 'delivered';

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    // Build query filter based on query parameters
    const filter = {};
    
    // Handle status filtering (can be single status or comma-separated list)
    if (req.query.status) {
      const statuses = req.query.status.split(',').map(s => s.trim());
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }
    
    // Handle fulfillment method filtering
    if (req.query.fulfillmentMethod) {
      filter.fulfillmentMethod = req.query.fulfillmentMethod;
    }
    
    // Handle payment status filtering
    if (req.query.isPaid !== undefined) {
      filter.isPaid = req.query.isPaid === 'true';
    }
    
    const orders = await Order.find(filter)
      .populate('user', 'id name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      const newStatus = req.body.status || order.status;
      
      // Validate payment before allowing delivery/shipped status
      if ((newStatus === 'shipped' || newStatus === 'delivered') && !order.isPaid) {
        return res.status(400).json({ 
          message: 'Payment must be confirmed before approving delivery or collection. Please confirm payment first.' 
        });
      }
      
      order.status = newStatus;
      
      // Handle cancellation with tracking
      if (newStatus === 'cancelled') {
        order.cancellation = {
          cancelledBy: req.body.cancelledBy || 'admin',
          cancelledByUser: req.user._id,
          reason: req.body.cancellationReason || 'No reason provided',
          cancelledAt: Date.now(),
        };
      }
      
      // Auto-mark as delivered if status is delivered
      if (newStatus === 'delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }
      
      const updatedOrder = await order.save();
      
      // Send status update email to customer if email sending is requested
      if (req.body.sendEmail && order.user) {
        try {
          await sendOrderStatusEmail(updatedOrder, order.user, newStatus);
        } catch (emailError) {
          console.error('Error sending status email:', emailError);
          // Don't fail the request if email fails
        }
      }
      
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send payment confirmation email
// @route   POST /api/orders/:id/send-confirmation
// @access  Private/Admin
export const sendPaymentConfirmation = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.isPaid) {
      return res.status(400).json({ message: 'Cannot send confirmation for unpaid order' });
    }

    if (!order.user) {
      return res.status(400).json({ message: 'Order has no associated user' });
    }

    await sendPaymentConfirmationEmail(order, order.user);
    
    res.json({ 
      success: true, 
      message: 'Payment confirmation email sent successfully',
      recipient: order.user.email 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export order receipt as HTML/PDF
// @route   GET /api/orders/:id/export
// @access  Private/Admin
export const exportOrderReceipt = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.user) {
      return res.status(400).json({ message: 'Order has no associated user' });
    }

    const html = generateOrderReceiptHTML(order, order.user);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="order-receipt-${order._id.toString().slice(-8)}.html"`);
    res.send(html);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export all orders as CSV
// @route   GET /api/orders/export/csv
// @access  Private/Admin
export const exportOrdersCSV = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    const csv = generateOrderCSV(orders);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export paid orders as CSV
// @route   GET /api/orders/export/paid-csv
// @access  Private/Admin
export const exportPaidOrdersCSV = async (req, res) => {
  try {
    const orders = await Order.find({ isPaid: true })
      .populate('user', 'name email')
      .sort({ paidAt: -1 });
    
    const csv = generateOrderCSV(orders);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="paid-orders-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel order (customer-initiated)
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify the user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Check if order can be cancelled
    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel a delivered order' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    order.status = 'cancelled';
    order.cancellation = {
      cancelledBy: 'customer',
      cancelledByUser: req.user._id,
      reason: req.body.reason || 'Customer requested cancellation',
      cancelledAt: Date.now(),
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
