import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  deliveryProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryProvider',
    default: null
  },
  customer: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: String,
    address: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      zipCode: {
        type: String,
        required: true
      },
      landmark: String
    }
  },
  pickupAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    landmark: String
  },
  status: {
    type: String,
    enum: [
      'pending',           // Created but not assigned
      'assigned',          // Assigned to provider
      'accepted',          // Provider accepted
      'picked_up',         // Package picked up
      'in_transit',        // On the way
      'out_for_delivery',  // Near destination
      'delivered',         // Successfully delivered
      'failed',            // Delivery failed
      'cancelled',         // Cancelled
      'returned'           // Returned to sender
    ],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  packageDetails: {
    description: String,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    value: Number,
    items: [{
      name: String,
      quantity: Number
    }]
  },
  deliveryFee: {
    type: Number,
    required: true,
    default: 0
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualPickupTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  assignedAt: {
    type: Date
  },
  acceptedAt: {
    type: Date
  },
  providerResponse: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'ignored'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  deliveryNotes: {
    type: String
  },
  proofOfDelivery: {
    signature: String,
    photo: String,
    receivedBy: String,
    notes: String
  },
  tracking: [{
    status: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['assigned', 'accepted', 'status_update', 'delivered', 'cancelled']
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    ratedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
deliverySchema.index({ orderId: 1 });
deliverySchema.index({ deliveryProvider: 1, status: 1 });
deliverySchema.index({ status: 1, createdAt: -1 });
deliverySchema.index({ 'providerResponse': 1 });

// Method to add tracking update
deliverySchema.methods.addTracking = function(status, location, notes) {
  this.tracking.push({
    status,
    location,
    notes,
    timestamp: new Date()
  });
  this.status = status;
  return this.save();
};

// Method to calculate delivery time
deliverySchema.methods.getDeliveryDuration = function() {
  if (this.actualDeliveryTime && this.actualPickupTime) {
    const duration = this.actualDeliveryTime - this.actualPickupTime;
    return Math.round(duration / (1000 * 60)); // Return in minutes
  }
  return null;
};

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;
