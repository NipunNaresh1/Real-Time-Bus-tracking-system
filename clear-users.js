const mongoose = require('mongoose');

const clearUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/bus-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Clear all users from the database
    const result = await mongoose.connection.db.collection('users').deleteMany({});
    console.log(`Deleted ${result.deletedCount} users from database`);
    
    // Also clear buses if any exist
    const busResult = await mongoose.connection.db.collection('buses').deleteMany({});
    console.log(`Deleted ${busResult.deletedCount} buses from database`);
    
    console.log('Database cleared successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearUsers();
