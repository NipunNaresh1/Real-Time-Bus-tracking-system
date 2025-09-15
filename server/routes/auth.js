const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').isLength({ min: 10, max: 15 }),
  body('role').isIn(['bus_operator', 'commuter', 'admin']),
  body('driverName').optional().isLength({ min: 1 }),
  body('conductorName').optional().isLength({ min: 1 }),
  body('maxCapacity').optional().isInt({ min: 1 }),
  body('routes').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, phone, password, role, driverName, conductorName, routes, maxCapacity } = req.body;
    console.log('Registration attempt:', { email, phone, role });

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const userData = {
      email,
      phone,
      password,
      role
    };

    // Add bus operator specific fields if role is bus_operator
    if (role === 'bus_operator') {
      if (!driverName || !conductorName || !maxCapacity) {
        return res.status(400).json({ 
          message: 'Driver name, conductor name, and max capacity are required for bus operators' 
        });
      }
      userData.driverName = driverName;
      userData.conductorName = conductorName;
      userData.maxCapacity = parseInt(maxCapacity);
      
      // Process routes if provided
      if (routes && Array.isArray(routes)) {
        userData.routes = routes.filter(route => 
          route.name && route.startLocation && route.endLocation
        );
      }
    }

    user = new User(userData);

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        ...(role === 'bus_operator' && { driverName, conductorName, routes, maxCapacity })
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        ...(user.role === 'bus_operator' && { 
          driverName: user.driverName, 
          conductorName: user.conductorName, 
          routes: user.routes, 
          maxCapacity: user.maxCapacity 
        })
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
