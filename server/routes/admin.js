const express = require('express');
const Bus = require('../models/Bus');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total buses
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ isActive: true, isOnRoute: true });

    // Get total users
    const totalUsers = await User.countDocuments();
    const busOperators = await User.countDocuments({ role: 'bus_operator' });
    const commuters = await User.countDocuments({ role: 'commuter' });

    // Get today's tickets and revenue
    const todayTickets = await Ticket.find({
      issuedAt: { $gte: today, $lt: tomorrow },
      status: 'active'
    });

    const totalTicketsToday = todayTickets.length;
    const totalRevenueToday = todayTickets.reduce((sum, ticket) => sum + ticket.price, 0);

    // Get active journeys
    const activeJourneys = await Bus.find({ isActive: true, isOnRoute: true })
      .populate('operatorId', 'driverName conductorName')
      .select('busNumber driverName conductorName route currentLocation currentCapacity maxCapacity journey');

    // Get recent tickets
    const recentTickets = await Ticket.find()
      .populate('busId', 'busNumber route')
      .populate('issuedBy', 'driverName conductorName')
      .sort({ issuedAt: -1 })
      .limit(10);

    res.json({
      overview: {
        totalBuses,
        activeBuses,
        totalUsers,
        busOperators,
        commuters,
        totalTicketsToday,
        totalRevenueToday
      },
      activeJourneys,
      recentTickets
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all buses
router.get('/buses', auth, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const buses = await Bus.find()
      .populate('operatorId', 'driverName conductorName email phone')
      .sort({ createdAt: -1 });

    res.json(buses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', auth, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get revenue analytics
router.get('/revenue', auth, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { period = '7' } = req.query;
    const days = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const tickets = await Ticket.find({
      issuedAt: { $gte: startDate },
      status: 'active'
    });

    // Group by date
    const revenueByDate = {};
    tickets.forEach(ticket => {
      const date = ticket.issuedAt.toISOString().split('T')[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = { tickets: 0, revenue: 0 };
      }
      revenueByDate[date].tickets += 1;
      revenueByDate[date].revenue += ticket.price;
    });

    // Convert to array format
    const revenueData = Object.entries(revenueByDate).map(([date, data]) => ({
      date,
      tickets: data.tickets,
      revenue: data.revenue
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalTickets = revenueData.reduce((sum, item) => sum + item.tickets, 0);

    res.json({
      period: `${days} days`,
      totalRevenue,
      totalTickets,
      dailyData: revenueData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bus performance
router.get('/bus-performance', auth, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const buses = await Bus.find()
      .populate('operatorId', 'driverName conductorName');

    const performance = buses.map(bus => ({
      busId: bus._id,
      busNumber: bus.busNumber,
      driverName: bus.driverName,
      conductorName: bus.conductorName,
      route: bus.route.name,
      isActive: bus.isActive,
      isOnRoute: bus.isOnRoute,
      currentCapacity: bus.currentCapacity,
      maxCapacity: bus.maxCapacity,
      crowdPercentage: bus.crowdPercentage,
      crowdStatus: bus.crowdStatus,
      totalTickets: bus.tickets.length,
      lastLocation: bus.currentLocation
    }));

    res.json(performance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
