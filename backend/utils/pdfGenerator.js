// PDF generation utility for order receipts
// This is a simple implementation that generates HTML-based PDFs
// For production, you might want to use libraries like pdfkit or puppeteer

export const generateOrderReceiptHTML = (order, user) => {
  const orderItemsHTML = order.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">R${item.price.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">R${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Receipt #${order._id.toString().slice(-8)}</title>
      <style>
        @page {
          margin: 0;
        }
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 40px;
          color: #1f2937;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          margin: -40px -40px 40px -40px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 36px;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 18px;
          opacity: 0.9;
        }
        .section {
          background: #f9fafb;
          padding: 24px;
          margin-bottom: 24px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #667eea;
          margin: 0 0 16px 0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .info-item {
          margin-bottom: 8px;
        }
        .info-label {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .info-value {
          color: #1f2937;
          font-size: 16px;
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        thead {
          background: #f3f4f6;
        }
        th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #d1d5db;
        }
        th.text-center {
          text-align: center;
        }
        th.text-right {
          text-align: right;
        }
        .total-section {
          background: white;
          padding: 24px;
          border-radius: 8px;
          margin-top: 24px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 16px;
        }
        .total-row.grand-total {
          border-top: 2px solid #d1d5db;
          margin-top: 8px;
          padding-top: 16px;
          font-size: 20px;
          font-weight: 700;
          color: #10b981;
        }
        .payment-status {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 600;
        }
        .payment-status.paid {
          background: #d1fae5;
          color: #065f46;
        }
        .payment-status.unpaid {
          background: #fee2e2;
          color: #991b1b;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-processing {
          background: #fef3c7;
          color: #92400e;
        }
        .badge-shipped {
          background: #dbeafe;
          color: #1e40af;
        }
        .badge-delivered {
          background: #d1fae5;
          color: #065f46;
        }
        .badge-cancelled {
          background: #fee2e2;
          color: #991b1b;
        }
        @media print {
          body {
            padding: 20px;
          }
          .header {
            margin: -20px -20px 20px -20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PAYMENT RECEIPT</h1>
        <p>Order #${order._id.toString().slice(-8)}</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">Order Information</h2>
        <div class="info-grid">
          <div>
            <div class="info-item">
              <div class="info-label">Order ID</div>
              <div class="info-value">#${order._id.toString().slice(-8)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Order Date</div>
              <div class="info-value">${new Date(order.createdAt).toLocaleString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Order Status</div>
              <div class="info-value">
                <span class="badge badge-${order.status}">${order.status.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <div>
            <div class="info-item">
              <div class="info-label">Customer Name</div>
              <div class="info-value">${user.name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${user.email}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Fulfillment Method</div>
              <div class="info-value">${order.fulfillmentMethod === 'delivery' ? 'Delivery' : 'Collection'}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">Payment Information</h2>
        <div class="info-grid">
          <div>
            <div class="info-item">
              <div class="info-label">Payment Method</div>
              <div class="info-value">${order.paymentMethod.toUpperCase()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Payment Status</div>
              <div class="info-value">
                <span class="payment-status ${order.isPaid ? 'paid' : 'unpaid'}">
                  ${order.isPaid ? 'PAID' : 'UNPAID'}
                </span>
              </div>
            </div>
          </div>
          <div>
            ${
              order.isPaid && order.paidAt
                ? `
            <div class="info-item">
              <div class="info-label">Payment Date</div>
              <div class="info-value">${new Date(order.paidAt).toLocaleString()}</div>
            </div>
            `
                : ''
            }
            ${
              order.paymentResult && order.paymentResult.id
                ? `
            <div class="info-item">
              <div class="info-label">Transaction ID</div>
              <div class="info-value">${order.paymentResult.id}</div>
            </div>
            `
                : ''
            }
          </div>
        </div>
      </div>
      
      ${
        order.fulfillmentMethod === 'delivery' && order.shippingAddress
          ? `
      <div class="section">
        <h2 class="section-title">Delivery Address</h2>
        <div class="info-value">
          ${order.shippingAddress.street}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
          ${order.shippingAddress.country}
        </div>
      </div>
      `
          : ''
      }
      
      <div class="section">
        <h2 class="section-title">Order Items</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th class="text-center">Quantity</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsHTML}
          </tbody>
        </table>
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <span>Items Subtotal:</span>
          <span>R${order.itemsPrice.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Tax (VAT):</span>
          <span>R${order.taxPrice.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Shipping Fee:</span>
          <span>R${order.shippingPrice.toFixed(2)}</span>
        </div>
        <div class="total-row grand-total">
          <span>TOTAL ${order.isPaid ? 'PAID' : 'AMOUNT'}:</span>
          <span>R${order.totalPrice.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="footer">
        <p><strong>Thank you for your business!</strong></p>
        <p>This is a computer-generated receipt. For any queries, please contact our support team.</p>
        <p>&copy; ${new Date().getFullYear()} EStore. All rights reserved.</p>
        <p style="margin-top: 16px; font-size: 12px;">Generated on: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
};

// Generate CSV format for export
export const generateOrderCSV = (orders) => {
  const headers = [
    'Order ID',
    'Customer Name',
    'Customer Email',
    'Order Date',
    'Total Amount',
    'Payment Method',
    'Payment Status',
    'Order Status',
    'Fulfillment Method',
    'Paid At',
  ];

  const rows = orders.map((order) => [
    `#${order._id.toString().slice(-8)}`,
    order.user?.name || 'N/A',
    order.user?.email || 'N/A',
    new Date(order.createdAt).toLocaleDateString(),
    `R${order.totalPrice.toFixed(2)}`,
    order.paymentMethod.toUpperCase(),
    order.isPaid ? 'Paid' : 'Unpaid',
    order.status,
    order.fulfillmentMethod,
    order.isPaid && order.paidAt ? new Date(order.paidAt).toLocaleDateString() : 'N/A',
  ]);

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

  return csvContent;
};
