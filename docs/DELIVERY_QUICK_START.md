# Delivery System - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Start the Backend
```bash
cd E:\EStock\estore\backend
npm start
```
Wait for: `✓ MongoDB connected` and `Server running on port 5000`

### Step 2: Start the Frontend
```bash
cd E:\EStock\estore
npm run dev
```
Open: `http://localhost:5173`

### Step 3: Access Admin Panel
1. Login at: `http://localhost:5173/login`
2. Navigate to: **Admin Dashboard → Delivery**
3. You'll see the delivery management interface

---

## 📦 Testing the Delivery System

### Test Scenario 1: Register a Delivery Provider

**Option A: Using the API directly**
```bash
# Use Postman or curl
POST http://localhost:5000/api/delivery/providers/register
Content-Type: application/json

{
  "name": "Test Driver",
  "email": "driver@test.com",
  "phone": "+1-555-0100",
  "vehicleType": "motorcycle",
  "vehicleNumber": "TEST-123",
  "licenseNumber": "DL-TEST-001",
  "address": {
    "street": "123 Test St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "bankDetails": {
    "accountName": "Test Driver",
    "accountNumber": "1234567890",
    "bankName": "Test Bank",
    "ifscCode": "TEST0001"
  }
}
```

**Option B: Run the sample script**
```bash
cd backend
node scripts/register-sample-provider.js
```

**Save the Provider ID** from the response - you'll need it to login!

### Test Scenario 2: Approve the Provider (Admin)

1. Go to Admin Panel → Delivery → Providers tab
2. Filter by "Pending" status
3. Find your test provider
4. Click **"Approve"**
5. Provider status changes to "Approved" and availability becomes "Available"

### Test Scenario 3: Create a Delivery Job (Admin)

1. Go to Delivery → Deliveries tab
2. Click **"Create Delivery Job"**
3. Fill in the form:
   ```
   Order ID: 507f1f77bcf86cd799439011 (any valid MongoDB ObjectId)
   Customer Name: John Doe
   Phone: +1-555-0200
   Address: 456 Customer St, New York, NY, 10002
   Delivery Fee: 10.00
   Priority: Normal
   Package Description: Electronics
   ```
4. Click **"Create Job"**
5. New delivery appears in the list with status "Pending"

### Test Scenario 4: Assign Delivery to Provider (Admin)

1. Find the pending delivery in the list
2. Click **"Assign"**
3. Select your approved provider from dropdown
4. Click **"Assign"**
5. Status changes to "Assigned"

### Test Scenario 5: Provider Dashboard

1. Open new tab: `http://localhost:5173/delivery-provider`
2. Enter the **Provider ID** you saved earlier
3. Click **"Login"**
4. You'll see the provider dashboard

### Test Scenario 6: Accept a Job (Provider)

1. In Provider Dashboard, go to **"Available Jobs"** tab
2. You should see the assigned delivery
3. Review the details (customer, address, fee)
4. Click **"Accept Job"**
5. Job moves to **"Active Deliveries"** tab

### Test Scenario 7: Update Delivery Status (Provider)

1. Go to **"Active Deliveries"** tab
2. Click **"Update Status"** on the delivery
3. Select status: **"Picked Up"**
4. Add notes: "Package collected from warehouse"
5. Click **"Update"**
6. Repeat for other statuses: In Transit → Out for Delivery

### Test Scenario 8: Complete Delivery (Provider)

1. When status is "Out for Delivery"
2. Click **"Mark Delivered"**
3. Fill in proof of delivery:
   ```
   Received By: John Doe
   Notes: Delivered at front door, customer signed
   ```
4. Click **"Confirm Delivery"**
5. Delivery status becomes "Delivered"
6. Provider's completed deliveries count increases

### Test Scenario 9: View Statistics (Admin)

1. Back to Admin Panel → Delivery
2. View the statistics dashboard:
   - Total Providers
   - Active Providers
   - Total Deliveries
   - Completion Rate
3. All metrics update in real-time!

---

## 🎯 Key URLs Reference

| Purpose | URL |
|---------|-----|
| Admin Delivery Management | http://localhost:5173/admin/delivery |
| Provider Dashboard | http://localhost:5173/delivery-provider |
| API Base | http://localhost:5000/api/delivery |

---

## 🔑 Provider Login Info

After registering a provider, you'll receive a Provider ID like:
```
Provider ID: 507f1f77bcf86cd799439011
```

**Important:** Save this ID! Use it to login at the Provider Dashboard.

You can also find Provider IDs in:
- Admin Panel → Delivery → Providers (hover over provider name)
- MongoDB database: `deliveryProviders` collection

---

## 📊 Testing Checklist

- [ ] Backend running
- [ ] Frontend running
- [ ] Provider registered
- [ ] Provider approved (Admin)
- [ ] Delivery job created
- [ ] Job assigned to provider
- [ ] Provider logged in
- [ ] Job accepted by provider
- [ ] Status updated multiple times
- [ ] Delivery completed with proof
- [ ] Statistics updated correctly
- [ ] Notifications working

---

## 🐛 Common Issues

### Provider not showing in assignment dropdown
**Solution:** Check that provider status is "Approved" and availability is "Available"

### Can't login as provider
**Solution:** Make sure you're using the correct Provider ID (MongoDB ObjectId format)

### No available jobs showing
**Solution:** 
1. Create a delivery job in admin panel
2. Assign it to your provider
3. Refresh the provider dashboard

### Statistics not updating
**Solution:** Refresh the page - statistics update on page load

---

## 🎨 UI Preview

### Admin Panel Features:
- 📊 Statistics Dashboard (4 cards)
- 👥 Provider Management Table
- 📦 Delivery Jobs Table
- ✅ Approve/Reject Controls
- 🚀 Assignment Modal
- ➕ Create Job Modal

### Provider Dashboard Features:
- 🏠 Dashboard Header with Stats
- 🔔 Notification Bell
- 📋 Three Tabs (Available/Active/History)
- ✅ Accept/Ignore Buttons
- 📍 Status Update Modal
- ✔️ Proof of Delivery Modal
- 🚦 Availability Toggle (Available/Busy/Offline)

---

## 🎉 Success Indicators

You'll know everything is working when:
1. ✅ Provider appears in admin panel
2. ✅ Provider can be approved
3. ✅ Jobs can be created and assigned
4. ✅ Provider sees available jobs
5. ✅ Status updates work smoothly
6. ✅ Deliveries complete successfully
7. ✅ Statistics reflect all changes

---

## 📚 Next Steps

After testing:
1. Read [DELIVERY_SYSTEM_GUIDE.md](./DELIVERY_SYSTEM_GUIDE.md) for detailed documentation
2. Check [DELIVERY_IMPLEMENTATION_SUMMARY.md](./DELIVERY_IMPLEMENTATION_SUMMARY.md) for technical details
3. Customize the UI to match your brand
4. Add more providers and test at scale
5. Implement additional features (GPS tracking, etc.)

---

## 💡 Pro Tips

1. **Keep Provider IDs handy** - Save them in a text file for easy testing
2. **Use MongoDB Compass** - View your data in the database visually
3. **Test with multiple providers** - Create 2-3 providers to test job distribution
4. **Try different priorities** - Create urgent vs normal deliveries
5. **Test the full workflow** - Go from order → delivery → completion

---

**Ready to go? Start with Step 1 above! 🚀**
