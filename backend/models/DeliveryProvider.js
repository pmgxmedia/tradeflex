import mongoose from 'mongoose';

const deliveryProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'motorcycle', 'car', 'van', 'truck'],
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'rejected'],
    default: 'pending'
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'offline'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  completedDeliveries: {
    type: Number,
    default: 0
  },
  cancelledDeliveries: {
    type: Number,
    default: 0
  },
  documents: {
    drivingLicense: String,
    vehicleRegistration: String,
    insurance: String,
    profilePhoto: String
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedReason: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
deliveryProviderSchema.index({ status: 1, availability: 1 });
deliveryProviderSchema.index({ email: 1 });

// Method to calculate success rate
deliveryProviderSchema.methods.getSuccessRate = function() {
  if (this.totalDeliveries === 0) return 0;
  return ((this.completedDeliveries / this.totalDeliveries) * 100).toFixed(2);
};

const DeliveryProvider = mongoose.model('DeliveryProvider', deliveryProviderSchema);

export default DeliveryProvider;
