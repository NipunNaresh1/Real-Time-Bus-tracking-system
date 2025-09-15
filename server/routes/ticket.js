const express = require('express');
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const Bus = require('../models/Bus');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate ticket
router.post('/generate', auth, [
  body('busId').isMongoId(),
  body('passengerName').notEmpty()
], async (req, res) => {
  try {
    if (req.userRole !== 'bus_operator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { busId, passengerName } = req.body;

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    if (bus.operatorId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!bus.isActive || !bus.isOnRoute) {
      return res.status(400).json({ message: 'Bus is not on route' });
    }

    if (bus.currentCapacity >= bus.maxCapacity) {
      return res.status(400).json({ message: 'Bus is at full capacity' });
    }

    // Create ticket
    const ticket = new Ticket({
      busId,
      passengerName,
      issuedBy: req.userId,
      price: 50 // Default ticket price
    });

    await ticket.save();

    // Update bus capacity and add ticket
    bus.currentCapacity += 1;
    bus.tickets.push({
      passengerName,
      issuedAt: ticket.issuedAt,
      ticketId: ticket.ticketId
    });

    await bus.save();

    // Notify all connected clients about crowd update
    const io = req.app.get('io');
    if (io) {
      // Emit to specific bus room
      io.to(`bus-${busId}`).emit('crowd-update', {
        busId,
        crowdCount: bus.currentCapacity,
        crowdPercentage: bus.crowdPercentage,
        crowdStatus: bus.crowdStatus,
        timestamp: new Date()
      });
      
      // Also emit general bus update for all commuters
      io.emit('bus-capacity-update', {
        busId,
        busNumber: bus.busNumber,
        currentCapacity: bus.currentCapacity,
        maxCapacity: bus.maxCapacity,
        crowdPercentage: bus.crowdPercentage,
        crowdStatus: bus.crowdStatus,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      message: 'Ticket generated successfully',
      ticket: {
        ticketId: ticket.ticketId,
        passengerName: ticket.passengerName,
        issuedAt: ticket.issuedAt,
        busNumber: bus.busNumber,
        route: bus.route.name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tickets for a bus
router.get('/bus/:busId', auth, async (req, res) => {
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

    const tickets = await Ticket.find({ busId: req.params.busId })
      .sort({ issuedAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tickets (for admin)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tickets = await Ticket.find()
      .populate('busId', 'busNumber route')
      .populate('issuedBy', 'driverName conductorName')
      .sort({ issuedAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get daily revenue
router.get('/revenue/daily', auth, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tickets = await Ticket.find({
      issuedAt: { $gte: today, $lt: tomorrow },
      status: 'active'
    });

    const totalTickets = tickets.length;
    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);

    res.json({
      date: today.toISOString().split('T')[0],
      totalTickets,
      totalRevenue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
