# Delivery Management System

## Overview

The Delivery Management System is a comprehensive solution for managing delivery operations in your e-commerce platform. It includes features for registering and approving delivery service providers, creating and assigning delivery jobs, real-time notifications, and tracking deliveries from pickup to completion.

## Features

### Admin Features
- **Provider Management**
  - Register new delivery service providers
  - Approve or reject provider applications
  - Suspend providers when needed
  - View provider statistics and ratings
  - Track provider availability status

- **Delivery Job Management**
  - Create delivery jobs from orders
  - Assign jobs to available providers
  - Monitor delivery status in real-time
  - View comprehensive delivery statistics
  - Filter deliveries by status and priority

- **Analytics Dashboard**
  - Total providers count
  - Active vs. offline providers
  - Pending approvals count
  - Total deliveries statistics
  - In-transit deliveries
  - Completion rate tracking

### Delivery Provider Features
- **Job Management**
  - Receive real-time job notifications
  - Accept or reject delivery jobs
  - View available jobs with details
  - Manage active deliveries
  - View delivery history

- **Availability Control**
  - Set status: Available, Busy, or Offline
  - Automatic job assignment when available
  - Real-time status updates

- **Delivery Tracking**
  - Update delivery status at each stage
  - Add location tracking
  - Provide delivery notes
  - Submit proof of delivery
  - Track completion metrics

### Notification System
- **Real-time Alerts**
  - New job assignments
  - Status updates
  - Delivery completions
  - Job cancellations
  - Browser notifications support

- **Notification Features**
  - Unread count badge
  - Mark as read functionality
  - Clear notifications
  - Timestamp display
  - Type-based icons and colors

## Architecture

### Backend Components

#### Models
1. **DeliveryProvider.js**
   - Provider registration details
   - Vehicle information
   - Documents and credentials
   - Performance metrics
   - Availability status

2. **Delivery.js**
   - Order association
   - Customer details
   - Delivery addresses
   - Package information
   - Status tracking
   - Proof of delivery
   - Rating system

#### Controllers
**deliveryController.js** handles:
- Provider registration and approval
- Job creation and assignment
- Status updates
- Delivery completion
- Statistics and analytics

#### Routes
**deliveryRoutes.js** provides endpoints for:
- `/api/delivery/providers/register` - Provider registration
- `/api/delivery/admin/providers` - Provider management
- `/api/delivery/admin/jobs` - Delivery job management
- `/api/delivery/provider/available-jobs` - Get available jobs
- `/api/delivery/provider/jobs/:id/respond` - Accept/reject jobs
- `/api/delivery/provider/jobs/:id/status` - Update delivery status
- `/api/delivery/provider/jobs/:id/complete` - Complete delivery

### Frontend Components

#### Admin Components
1. **AdminDeliveryManagement.jsx**
   - Provider management interface
   - Delivery job creation
   - Assignment modal
   - Statistics dashboard
   - Filter and search capabilities

#### Provider Components
2. **DeliveryProviderDashboard.jsx**
   - Provider login
   - Available jobs list
   - Active deliveries tracking
   - Delivery history
   - Status update modals
   - Proof of delivery submission

#### Notification Components
3. **DeliveryNotificationContext.jsx**
   - Notification state management
   - Real-time updates
   - Browser notification integration
   - Notification persistence

4. **DeliveryNotificationBell.jsx**
   - Notification dropdown
   - Unread badge
   - Mark as read/clear
   - Type-based styling

## Usage Guide

### For Administrators

#### 1. Approving Delivery Providers
1. Navigate to Admin Dashboard → Delivery
2. Click on "Providers" tab
3. Filter by status "Pending"
4. Review provider details
5. Click "Approve" or "Reject"
6. For rejection, provide a reason

#### 2. Creating Delivery Jobs
1. Go to Delivery tab
2. Click "Create Delivery Job"
3. Fill in order details:
   - Order ID
   - Customer information
   - Delivery address
   - Package details
   - Delivery fee
   - Priority level
4. Click "Create Job"

#### 3. Assigning Deliveries
1. View pending deliveries
2. Click "Assign" on a delivery
3. Select from available providers
4. Confirm assignment

#### 4. Monitoring Deliveries
- View statistics dashboard for overview
- Filter deliveries by status
- Track real-time status updates
- Monitor provider performance

### For Delivery Providers

#### 1. Getting Started
1. Navigate to `/delivery-provider`
2. Enter your Provider ID
3. Click "Login"

#### 2. Managing Availability
- Set status to:
  - **Available**: Ready to accept jobs
  - **Busy**: Currently on delivery
  - **Offline**: Not accepting jobs

#### 3. Accepting Jobs
1. View "Available Jobs" tab
2. Review job details:
   - Delivery fee
   - Customer information
   - Delivery address
   - Priority level
3. Click "Accept Job" or "Ignore"

#### 4. Updating Delivery Status
1. Go to "Active Deliveries" tab
2. Select a delivery
3. Click "Update Status"
4. Choose new status:
   - Picked Up
   - In Transit
   - Out for Delivery
5. Add notes and location (optional)
6. Confirm update

#### 5. Completing Deliveries
1. When near destination, click "Mark Delivered"
2. Fill in proof of delivery:
   - Received by (name)
   - Delivery notes
   - Optional: Signature/Photo
3. Click "Confirm Delivery"

### For Customers (Future Enhancement)
- Track delivery in real-time
- View estimated delivery time
- Rate delivery service
- Contact delivery provider

## API Endpoints Reference

### Provider Endpoints
```
POST   /api/delivery/providers/register
GET    /api/delivery/admin/providers
PUT    /api/delivery/admin/providers/:id/status
PUT    /api/delivery/provider/:id/availability
GET    /api/delivery/provider/:providerId/history
```

### Delivery Job Endpoints
```
POST   /api/delivery/admin/jobs
GET    /api/delivery/admin/jobs
PUT    /api/delivery/admin/jobs/:id/assign
GET    /api/delivery/provider/available-jobs
PUT    /api/delivery/provider/jobs/:id/respond
PUT    /api/delivery/provider/jobs/:id/status
PUT    /api/delivery/provider/jobs/:id/complete
```

### Statistics Endpoint
```
GET    /api/delivery/admin/statistics
```

## Database Schema

### DeliveryProvider Schema
```javascript
{
  name: String,
  email: String (unique),
  phone: String,
  vehicleType: Enum,
  vehicleNumber: String (unique),
  licenseNumber: String,
  address: Object,
  status: Enum (pending/approved/suspended/rejected),
  availability: Enum (available/busy/offline),
  rating: Number,
  totalDeliveries: Number,
  completedDeliveries: Number,
  documents: Object,
  bankDetails: Object
}
```

### Delivery Schema
```javascript
{
  orderId: ObjectId (ref: Order),
  deliveryProvider: ObjectId (ref: DeliveryProvider),
  customer: Object,
  pickupAddress: Object,
  status: Enum,
  priority: Enum,
  packageDetails: Object,
  deliveryFee: Number,
  tracking: Array,
  notifications: Array,
  proofOfDelivery: Object,
  rating: Object
}
```

## Status Flow

### Delivery Status Progression
1. **pending** - Created, not assigned
2. **assigned** - Assigned to provider
3. **accepted** - Provider accepted
4. **picked_up** - Package picked up
5. **in_transit** - On the way
6. **out_for_delivery** - Near destination
7. **delivered** - Successfully delivered

### Alternative Statuses
- **failed** - Delivery attempt failed
- **cancelled** - Delivery cancelled
- **returned** - Returned to sender

## Notification Types

- `new_job` - New delivery job assigned
- `job_assigned` - Job assignment confirmation
- `status_update` - Delivery status changed
- `delivery_completed` - Delivery completed
- `job_cancelled` - Job cancelled
- `reminder` - Delivery reminders

## Security Considerations

1. **Authentication**: Admin routes protected with JWT authentication
2. **Authorization**: Provider-specific operations validated by Provider ID
3. **Data Validation**: All inputs validated on backend
4. **Error Handling**: Comprehensive error messages without exposing sensitive data

## Future Enhancements

1. **Real-time GPS Tracking**
   - Live location updates
   - Route optimization
   - ETA calculations

2. **Enhanced Analytics**
   - Provider performance reports
   - Heat maps of delivery areas
   - Time-based analytics

3. **Customer Features**
   - Live tracking interface
   - Direct messaging with provider
   - Delivery time slot selection

4. **Advanced Notifications**
   - SMS/Email notifications
   - Push notifications
   - Custom notification preferences

5. **Payment Integration**
   - Automated provider payments
   - Cash on delivery tracking
   - Tip management

6. **Document Management**
   - Digital signature capture
   - Photo proof upload
   - Document verification

## Troubleshooting

### Common Issues

**Provider not receiving jobs**
- Check availability status (must be "Available")
- Verify provider is approved
- Ensure provider ID is correct

**Delivery status not updating**
- Check network connection
- Verify provider ID matches assignment
- Ensure delivery is in active state

**Notifications not showing**
- Enable browser notifications
- Check notification permissions
- Refresh the page

## Support

For technical support or questions:
- Check the main README.md
- Review API documentation
- Contact system administrator

## Version History

- **v1.0.0** - Initial release
  - Provider registration and approval
  - Delivery job management
  - Basic notification system
  - Admin and provider dashboards
