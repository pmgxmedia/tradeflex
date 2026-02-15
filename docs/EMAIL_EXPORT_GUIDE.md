# Email Export & Confirmation Features

This document describes the new email and export functionality added to the admin orders management system.

## Features Added

### 1. **Email Confirmation System**
- Automatically sends payment confirmation emails to customers
- Sends order status update emails (processing, shipped, delivered, cancelled)
- Beautiful HTML email templates with order details
- Includes order items, payment summary, and delivery information

### 2. **Export Functionality**
- **Individual Order Receipt**: Download HTML receipt for any paid order
- **All Orders CSV**: Export all orders to CSV format
- **Paid Orders CSV**: Export only paid/fulfilled orders to CSV format

### 3. **Admin Interface Enhancements**
- Export buttons in Payment Analysis tab
- Download Receipt and Send Confirmation buttons for paid orders
- One-click export functionality with automatic downloads

## Backend Setup

### Email Configuration

The email service uses nodemailer. To enable email sending in production:

1. **Install nodemailer** (already added to package.json):
```bash
cd backend
npm install
```

2. **Configure Environment Variables** in `backend/.env`:

```env
# Email Configuration (Optional - for production)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

**Note for Gmail:**
- Enable 2-factor authentication on your Gmail account
- Generate an App-Specific Password: https://myaccount.google.com/apppasswords
- Use the app-specific password (not your regular Gmail password)

3. **Development Mode**:
   - If `EMAIL_SERVICE` is not set, emails will be logged to console instead of being sent
   - This allows testing without email configuration

### Alternative Email Services

You can use other email services by modifying `backend/utils/emailService.js`:

**SendGrid:**
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

**AWS SES:**
```javascript
const transporter = nodemailer.createTransport({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  auth: {
    user: process.env.AWS_SES_USER,
    pass: process.env.AWS_SES_PASSWORD
  }
});
```

## API Endpoints

### Email Endpoints

#### Send Payment Confirmation
```
POST /api/orders/:id/send-confirmation
Authorization: Required (Admin)
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmation email sent successfully",
  "recipient": "customer@example.com"
}
```

### Export Endpoints

#### Export Single Order Receipt
```
GET /api/orders/:id/export
Authorization: Required (Admin)
```

Downloads an HTML file with the order receipt that can be printed or saved as PDF.

#### Export All Orders CSV
```
GET /api/orders/export/csv
Authorization: Required (Admin)
```

Downloads a CSV file with all orders.

#### Export Paid Orders CSV
```
GET /api/orders/export/paid-csv
Authorization: Required (Admin)
```

Downloads a CSV file with only paid orders.

## Frontend Usage

### In AdminOrders Component

**Export All Orders:**
```javascript
import { exportAllOrdersCSV } from '../../services/api';

const handleExport = () => {
  exportAllOrdersCSV();
};
```

**Send Email Confirmation:**
```javascript
import { sendPaymentConfirmationEmail } from '../../services/api';

const handleSendEmail = async (orderId) => {
  const result = await sendPaymentConfirmationEmail(orderId);
  console.log('Email sent to:', result.recipient);
};
```

**Export Order Receipt:**
```javascript
import { exportOrderReceipt } from '../../services/api';

const handleExportReceipt = (orderId) => {
  exportOrderReceipt(orderId);
};
```

## Email Templates

### Payment Confirmation Email
Sent when admin confirms a payment or when customer completes payment.

**Includes:**
- Order details (ID, date, status)
- Complete order items list with prices
- Payment summary (items, tax, shipping, total)
- Delivery/collection information
- Professional branding with gradient header

### Order Status Update Email
Sent when order status changes (shipped, delivered, etc.).

**Includes:**
- Status-specific messaging
- Order summary
- Color-coded status indicators
- Next steps information

## CSV Export Format

The CSV export includes the following columns:
- Order ID
- Customer Name
- Customer Email
- Order Date
- Total Amount
- Payment Method
- Payment Status
- Order Status
- Fulfillment Method
- Paid At

## Security Notes

1. **Authentication**: All export and email endpoints require admin authentication
2. **Email Credentials**: Store email credentials securely in environment variables
3. **Never commit** `.env` file to version control
4. **Token in URL**: Export endpoints use token in URL for download functionality

## Troubleshooting

### Emails Not Sending

1. Check environment variables are set correctly
2. Verify Gmail app-specific password if using Gmail
3. Check console logs for error messages
4. Ensure nodemailer is installed: `npm list nodemailer`

### Export Not Working

1. Verify user is logged in as admin
2. Check browser console for errors
3. Ensure backend server is running
4. Verify API_URL is configured correctly in frontend

### CSV Format Issues

1. Open CSV in text editor to verify format
2. Try importing in Excel or Google Sheets
3. Check for special characters in data

## Future Enhancements

Potential improvements:
- PDF generation using puppeteer or pdfkit
- Email scheduling (send later)
- Email templates customization in admin panel
- Bulk email sending
- Email delivery tracking
- SMS notifications
- Webhook integrations

## Support

For issues or questions, please check:
1. Backend console logs
2. Browser developer console
3. Network tab for API responses
4. Email service provider documentation
