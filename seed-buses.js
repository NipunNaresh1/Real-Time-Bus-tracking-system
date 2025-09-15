const mongoose = require('mongoose');

const seedBuses = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/bus-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Sample bus data with kapurthala-barnala route
    const buses = [
      {
        busNumber: 'PB01AZ0011',
        driverName: 'nikhil',
        conductorName: 'conductor1',
        capacity: 50,
        maxCapacity: 50,
        currentCapacity: 15,
        isActive: true,
        route: {
          name: 'kapurthala-barnala',
          startLocation: 'kapurthala',
          endLocation: 'barnala',
          stops: ['kapurthala', 'phagwara', 'jalandhar', 'ludhiana', 'barnala'],
          distance: 85
        },
        currentLocation: {
          latitude: 31.3800,
          longitude: 75.3800,
          address: 'Kapurthala, Punjab',
          lastUpdated: new Date()
        },
        journey: {
          startTime: new Date(),
          estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
        }
      },
      {
        busNumber: 'PB02XY0022',
        driverName: 'rajesh',
        conductorName: 'conductor2',
        capacity: 45,
        maxCapacity: 45,
        currentCapacity: 30,
        isActive: true,
        route: {
          name: 'barnala-kapurthala',
          startLocation: 'barnala',
          endLocation: 'kapurthala',
          stops: ['barnala', 'ludhiana', 'jalandhar', 'phagwara', 'kapurthala'],
          distance: 85
        },
        currentLocation: {
          latitude: 30.2500,
          longitude: 75.5500,
          address: 'Barnala, Punjab',
          lastUpdated: new Date()
        },
        journey: {
          startTime: new Date(),
          estimatedArrival: new Date(Date.now() + 1.5 * 60 * 60 * 1000) // 1.5 hours from now
        }
      },
      {
        busNumber: 'PB03AB0033',
        driverName: 'suresh',
        conductorName: 'conductor3',
        capacity: 40,
        maxCapacity: 40,
        currentCapacity: 10,
        isActive: true,
        route: {
          name: 'kapurthala-barnala-express',
          startLocation: 'kapurthala',
          endLocation: 'barnala',
          stops: ['kapurthala', 'jalandhar', 'ludhiana', 'barnala'],
          distance: 70
        },
        currentLocation: {
          latitude: 31.3200,
          longitude: 75.5700,
          address: 'Jalandhar, Punjab',
          lastUpdated: new Date()
        },
        journey: {
          startTime: new Date(),
          estimatedArrival: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour from now
        }
      }
    ];
    
    // Clear existing buses
    await mongoose.connection.db.collection('buses').deleteMany({});
    console.log('Cleared existing buses');
    
    // Insert new buses
    const result = await mongoose.connection.db.collection('buses').insertMany(buses);
    console.log(`Inserted ${result.insertedCount} buses into database`);
    
    console.log('Bus seeding completed successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding buses:', error);
    process.exit(1);
  }
};

seedBuses();
