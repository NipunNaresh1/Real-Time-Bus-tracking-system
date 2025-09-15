const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  busNumber: {
    type: String,
    required: true,
    unique: true
  },
  driverName: {
    type: String,
    required: true
  },
  conductorName: {
    type: String,
    required: true
  },
  route: {
    name: String,
    startLocation: String,
    endLocation: String,
    stops: [String],
    distance: Number
  },
  maxCapacity: {
    type: Number,
    required: true
  },
  currentCapacity: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isOnRoute: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    lastUpdated: Date
  },
  journey: {
    startTime: Date,
    endTime: Date,
    currentStop: String,
    nextStop: String,
    estimatedArrival: Date
  },
  tickets: [{
    passengerName: String,
    issuedAt: Date,
    ticketId: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate crowd percentage
busSchema.virtual('crowdPercentage').get(function() {
  return Math.round((this.currentCapacity / this.maxCapacity) * 100);
});

// Get crowd status
busSchema.virtual('crowdStatus').get(function() {
  const percentage = this.crowdPercentage;
  if (percentage < 30) return 'low';
  if (percentage < 70) return 'medium';
  return 'high';
});

module.exports = mongoose.model('Bus', busSchema);
