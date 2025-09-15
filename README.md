# Real-Time Bus Tracking System

A comprehensive real-time bus tracking system with crowd management, built with React, Node.js, Express, MongoDB, and Socket.io.

## Features

### 🚌 Bus Operators
- **Registration & Login**: Secure authentication for bus operators
- **Bus Management**: Create and manage multiple buses with routes
- **Real-time Location Tracking**: GPS-based location updates
- **Ticket Generation**: Generate tickets for passengers with crowd management
- **Journey Control**: Start/stop journeys and monitor bus status
- **Crowd Monitoring**: Real-time crowd level display

### 👥 Commuters
- **User Registration**: Easy signup with email/phone
- **Route Search**: Find buses by start and end locations
- **Real-time Tracking**: Live bus location and ETA updates
- **Crowd Status**: See current crowd level before boarding
- **Interactive Map**: Visual representation of bus location

### 👨‍💼 Admin Portal
- **Dashboard Analytics**: Overview of system statistics
- **Revenue Tracking**: Daily and period-based revenue reports
- **User Management**: Monitor all users and their activities
- **Bus Performance**: Track all buses and their performance
- **Real-time Monitoring**: Live view of active journeys

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time updates
- **Leaflet** - Interactive maps
- **Recharts** - Data visualization
- **React Toastify** - Notifications

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Backend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the server directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/bus-tracker
   JWT_SECRET=your-super-secret-jwt-key
   ```

3. **Start the server**
   ```bash
   npm run server
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

### Full Application

To run both backend and frontend simultaneously:
```bash
npm run dev
```

## Usage

### For Bus Operators

1. **Register** as a Bus Operator
2. **Create Buses** with route information
3. **Start Journey** when ready to begin
4. **Generate Tickets** for passengers
5. **Update Location** in real-time
6. **End Journey** when complete

### For Commuters

1. **Register** as a Commuter
2. **Search Buses** by route
3. **Select Bus** to track
4. **View Real-time** location and crowd status
5. **Check ETA** for arrival time

### For Admins

1. **Login** to Admin portal
2. **View Dashboard** for system overview
3. **Monitor Revenue** and analytics
4. **Track Performance** of all buses
5. **Manage Users** and system data

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Bus Management
- `POST /api/bus/create` - Create new bus
- `GET /api/bus/my-buses` - Get operator's buses
- `POST /api/bus/:id/start-journey` - Start journey
- `POST /api/bus/:id/end-journey` - End journey
- `POST /api/bus/:id/update-location` - Update location
- `GET /api/bus/active` - Get active buses
- `GET /api/bus/search` - Search buses by route

### Ticket Management
- `POST /api/ticket/generate` - Generate ticket
- `GET /api/ticket/bus/:id` - Get bus tickets
- `GET /api/ticket/all` - Get all tickets (admin)
- `GET /api/ticket/revenue/daily` - Get daily revenue

### Admin
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/buses` - All buses
- `GET /api/admin/users` - All users
- `GET /api/admin/revenue` - Revenue analytics
- `GET /api/admin/bus-performance` - Bus performance

## Real-time Features

### Socket.io Events

**Client to Server:**
- `join-bus` - Join bus room for updates
- `leave-bus` - Leave bus room
- `update-location` - Update bus location
- `update-crowd` - Update crowd count

**Server to Client:**
- `location-update` - Real-time location updates
- `crowd-update` - Crowd level changes
- `journey-started` - New journey started
- `journey-ended` - Journey completed

## Database Schema

### Users Collection
```javascript
{
  email: String,
  phone: String,
  password: String,
  role: String, // 'bus_operator', 'commuter', 'admin'
  driverName: String, // for bus operators
  conductorName: String, // for bus operators
  routes: Array, // for bus operators
  maxCapacity: Number // for bus operators
}
```

### Buses Collection
```javascript
{
  operatorId: ObjectId,
  busNumber: String,
  driverName: String,
  conductorName: String,
  route: Object,
  maxCapacity: Number,
  currentCapacity: Number,
  isActive: Boolean,
  isOnRoute: Boolean,
  currentLocation: Object,
  journey: Object,
  tickets: Array
}
```

### Tickets Collection
```javascript
{
  ticketId: String,
  busId: ObjectId,
  passengerName: String,
  issuedBy: ObjectId,
  issuedAt: Date,
  status: String,
  price: Number
}
```

## Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcryptjs for password security
- **Input Validation** - Express-validator for data validation
- **CORS Protection** - Cross-origin request handling
- **Role-based Access** - Different permissions for different user types

## Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to Heroku, AWS, or similar platform
4. Update CORS settings for production domain

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to Netlify, Vercel, or similar platform
3. Update API endpoints to production URLs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

---

**Built with ❤️ for efficient public transportation management**
