// Email service for sending order confirmations
// Falls back to console logging if nodemailer is not installed or not configured

// Dynamically import nodemailer to handle cases where it's not installed
let nodemailerModule = null;

const loadNodemailer = async () => {
  if (nodemailerModule === null) {
    try {
      nodemailerModule = await import('nodemailer');
    } catch (error) {
      console.warn('⚠️  nodemailer not installed. Emails will be logged to console only.');
      console.warn('   Install with: cd backend && npm install nodemailer');
      nodemailerModule = false; // Mark as failed to load
    }
  }
  return nodemailerModule;
};

// Create email transporter
const createTransporter = async () => {
  const nodemailer = await loadNodemailer();
  
  if (!nodemailer) {
    // Fallback when nodemailer is not installed
    return {
      sendMail: async (mailOptions) => {
        console.log('📧 ========================================');
        console.log('📧 EMAIL WOULD BE SENT (nodemailer not installed)');
        console.log('📧 Install: cd backend && npm install nodemailer');
        console.log('📧 ========================================');
        console.log('📧 To:', mailOptions.to);
        console.log('📧 Subject:', mailOptions.subject);
        console.log('📧 ========================================');
        return { messageId: 'dev-fallback-' + Date.now() };
      },
    };
  }
  
  // For development, use a test account
  // In production, use real SMTP credentials from environment variables
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.default.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Default to console logging for development
    return {
      sendMail: async (mailOptions) => {
        console.log('📧 Email would be sent:');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        return { messageId: 'dev-' + Date.now() };
      },
    };
  }
};

// Send payment confirmation email to customer
export const sendPaymentConfirmationEmail = async (order, user) => {
  const transporter = await createTransporter();

  const orderItemsHTML = order.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@estore.com',
    to: user.email,
    subject: `Payment Confirmed - Order #${order._id.toString().slice(-8)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Payment Confirmed! ✓</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear ${user.name},</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Great news! Your payment has been confirmed and your order is now being processed.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
            <h2 style="margin-top: 0; color: #10b981; font-size: 20px;">Order Details</h2>
            <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-8)}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
            <p style="margin: 5px 0;"><strong>Fulfillment:</strong> ${order.fulfillmentMethod === 'delivery' ? 'Delivery' : 'Collection'}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">${order.status.toUpperCase()}</span></p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; font-size: 18px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHTML}
              </tbody>
            </table>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; font-size: 18px;">Payment Summary</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px;">Items Price:</td>
                <td style="padding: 5px; text-align: right;">R${order.itemsPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 5px;">Tax (VAT 15%):</td>
                <td style="padding: 5px; text-align: right;">R${order.taxPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 5px;">Shipping:</td>
                <td style="padding: 5px; text-align: right;">R${order.shippingPrice.toFixed(2)}</td>
              </tr>
              <tr style="border-top: 2px solid #ddd; font-weight: bold; font-size: 18px;">
                <td style="padding: 10px 5px;">Total Paid:</td>
                <td style="padding: 10px 5px; text-align: right; color: #10b981;">R${order.totalPrice.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            We'll keep you updated on your order status. If you have any questions, please don't hesitate to contact us.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 5px;">Best regards,</p>
          <p style="font-size: 16px; margin-top: 5px;"><strong>The EStore Team</strong></p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} EStore. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Payment confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending payment confirmation email:', error);
    throw new Error('Failed to send payment confirmation email');
  }
};

// Send order status update email
export const sendOrderStatusEmail = async (order, user, newStatus) => {
  const transporter = await createTransporter();

  const statusMessages = {
    processing: {
      subject: 'Order Processing',
      title: 'Your Order is Being Processed',
      message: 'We have received your order and are currently processing it.',
      color: '#f59e0b',
    },
    shipped: {
      subject: order.fulfillmentMethod === 'delivery' ? 'Order Shipped' : 'Order Ready for Collection',
      title: order.fulfillmentMethod === 'delivery' ? 'Your Order Has Been Shipped! 📦' : 'Your Order is Ready for Collection! 🎉',
      message:
        order.fulfillmentMethod === 'delivery'
          ? 'Great news! Your order is on its way to you.'
          : 'Your order is ready and waiting for you at our store.',
      color: '#3b82f6',
    },
    delivered: {
      subject: order.fulfillmentMethod === 'delivery' ? 'Order Delivered' : 'Order Collected',
      title: order.fulfillmentMethod === 'delivery' ? 'Your Order Has Been Delivered! ✓' : 'Order Collected Successfully! ✓',
      message:
        order.fulfillmentMethod === 'delivery'
          ? 'Your order has been successfully delivered. We hope you enjoy your purchase!'
          : 'Thank you for collecting your order. We hope you enjoy your purchase!',
      color: '#10b981',
    },
    cancelled: {
      subject: 'Order Cancelled',
      title: 'Your Order Has Been Cancelled',
      message: 'Your order has been cancelled. If you have any questions, please contact our support team.',
      color: '#ef4444',
    },
  };

  const statusInfo = statusMessages[newStatus] || statusMessages.processing;

  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@estore.com',
    to: user.email,
    subject: `${statusInfo.subject} - Order #${order._id.toString().slice(-8)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${statusInfo.color}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${statusInfo.title}</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear ${user.name},</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">${statusInfo.message}</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${statusInfo.color};">
            <h2 style="margin-top: 0; color: ${statusInfo.color}; font-size: 20px;">Order Details</h2>
            <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-8)}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> R${order.totalPrice.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusInfo.color}; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Thank you for shopping with us! If you have any questions, please don't hesitate to contact us.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 5px;">Best regards,</p>
          <p style="font-size: 16px; margin-top: 5px;"><strong>The EStore Team</strong></p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} EStore. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Order status email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending order status email:', error);
    throw new Error('Failed to send order status email');
  }
};
