const express = require('express');
const { body, validationResult } = require('express-validator');
const Bus = require('../models/Bus');
const auth = require('../middleware/auth');

const router = express.Router();

// Create new bus
router.post('/create', auth, [
  body('busNumber').notEmpty(),
  body('driverName').notEmpty(),
  body('conductorName').notEmpty(),
  body('route').isObject(),
  body('maxCapacity').isNumeric()
], async (req, res) => {
  try {
    if (req.userRole !== 'bus_operator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { busNumber, driverName, conductorName, route, maxCapacity } = req.body;

    const bus = new Bus({
      operatorId: req.userId,
      busNumber,
      driverName,
      conductorName,
      route,
      maxCapacity
    });

    await bus.save();
    res.status(201).json({ message: 'Bus created successfully', bus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all buses for operator
router.get('/my-buses', auth, async (req, res) => {
  try {
    if (req.userRole !== 'bus_operator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const buses = await Bus.find({ operatorId: req.userId });
    res.json(buses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start journey
router.post('/:busId/start-journey', auth, async (req, res) => {
  try {
    if (req.userRole !== 'bus_operator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bus = await Bus.findById(req.params.busId);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    if (bus.operatorId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    bus.isActive = true;
    bus.isOnRoute = true;
    bus.journey.startTime = new Date();
    bus.journey.currentStop = bus.route.stops[0];
    bus.journey.nextStop = bus.route.stops[1];

    await bus.save();

    // Notify all connected clients
    const io = req.app.get('io');
    io.emit('journey-started', {
      busId: bus._id,
      busNumber: bus.busNumber,
      route: bus.route
    });

    res.json({ message: 'Journey started successfully', bus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End journey
router.post('/:busId/end-journey', auth, async (req, res) => {
  try {
    if (req.userRole !== 'bus_operator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bus = await Bus.findById(req.params.busId);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    if (bus.operatorId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    bus.isActive = false;
    bus.isOnRoute = false;
    bus.journey.endTime = new Date();
    bus.currentCapacity = 0;
    bus.tickets = [];

    await bus.save();

    // Notify all connected clients
    const io = req.app.get('io');
    io.emit('journey-ended', {
      busId: bus._id,
      busNumber: bus.busNumber
    });

    res.json({ message: 'Journey ended successfully', bus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bus location
router.post('/:busId/update-location', auth, [
  body('latitude').isNumeric(),
  body('longitude').isNumeric(),
  body('address').notEmpty()
], async (req, res) => {
  try {
    if (req.userRole !== 'bus_operator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bus = await Bus.findById(req.params.busId);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    if (bus.operatorId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { latitude, longitude, address } = req.body;

    bus.currentLocation = {
      latitude,
      longitude,
      address,
      lastUpdated: new Date()
    };

    await bus.save();

    // Notify all connected clients
    const io = req.app.get('io');
    if (io) {
      io.to(`bus-${bus._id}`).emit('location-update', {
        busId: bus._id,
        location: bus.currentLocation,
        crowdCount: bus.currentCapacity,
        timestamp: new Date()
      });
      
      io.emit(`location-update-${bus._id}`, {
        latitude,
        longitude,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Location updated successfully', bus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all active buses (for commuters)
router.get('/active', async (req, res) => {
  try {
    const buses = await Bus.find({ isActive: true, isOnRoute: true })
      .populate('operatorId', 'driverName conductorName')
      .select('-tickets');
    
    res.json(buses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search buses by route
router.get('/search', async (req, res) => {
  try {
    const { startLocation, endLocation } = req.query;
    
    if (!startLocation || !endLocation) {
      return res.status(400).json({ message: 'Start and end locations are required' });
    }

    const buses = await Bus.find({
      isActive: true,
      isOnRoute: true,
      'route.stops': { $all: [startLocation, endLocation] }
    }).populate('operatorId', 'driverName conductorName');

    res.json(buses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
