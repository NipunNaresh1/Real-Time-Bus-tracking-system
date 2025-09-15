const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seedDemoUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/bus-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Hash password for demo users
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    // Demo users for bus operators
    const demoUsers = [
      {
        name: 'Nikhil Kumar',
        email: 'nikhil@demo.com',
        phone: '9876543210',
        password: hashedPassword,
        role: 'bus_operator',
        busNumber: 'PB01AZ0011',
        route: 'kapurthala-barnala',
        capacity: 50
      },
      {
        name: 'Rajesh Singh',
        email: 'rajesh@demo.com',
        phone: '9876543211',
        password: hashedPassword,
        role: 'bus_operator',
        busNumber: 'PB02XY0022',
        route: 'barnala-kapurthala',
        capacity: 45
      },
      {
        name: 'Suresh Sharma',
        email: 'suresh@demo.com',
        phone: '9876543212',
        password: hashedPassword,
        role: 'bus_operator',
        busNumber: 'PB03AB0033',
        route: 'kapurthala-barnala-express',
        capacity: 40
      },
      {
        name: 'Demo Commuter',
        email: 'commuter@demo.com',
        phone: '9876543213',
        password: hashedPassword,
        role: 'commuter'
      },
      {
        name: 'Admin User',
        email: 'admin@demo.com',
        phone: '9876543214',
        password: hashedPassword,
        role: 'admin'
      }
    ];
    
    // Clear existing demo users
    await mongoose.connection.db.collection('users').deleteMany({
      email: { $in: demoUsers.map(u => u.email) }
    });
    console.log('Cleared existing demo users');
    
    // Insert demo users
    const result = await mongoose.connection.db.collection('users').insertMany(demoUsers);
    console.log(`Inserted ${result.insertedCount} demo users into database`);
    
    console.log('\n=== DEMO LOGIN CREDENTIALS ===');
    console.log('\n🚌 BUS OPERATORS:');
    console.log('1. Email: nikhil@demo.com | Password: demo123 | Bus: PB01AZ0011');
    console.log('2. Email: rajesh@demo.com | Password: demo123 | Bus: PB02XY0022');
    console.log('3. Email: suresh@demo.com | Password: demo123 | Bus: PB03AB0033');
    
    console.log('\n👥 COMMUTER:');
    console.log('Email: commuter@demo.com | Password: demo123');
    
    console.log('\n⚙️ ADMIN:');
    console.log('Email: admin@demo.com | Password: demo123');
    
    console.log('\nDemo users created successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo users:', error);
    process.exit(1);
  }
};

seedDemoUsers();
