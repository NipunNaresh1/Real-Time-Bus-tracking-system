import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import io from 'socket.io-client';
import { getApiBase, getSocketUrl } from '../config';
import BusSearch from '../components/BusSearch';
import BusList from '../components/BusList';
import BusMap from '../components/BusMap';
import ComplaintForm from '../components/ComplaintForm';
import './Dashboard.css';

const CommuterDashboard = () => {
  const { user } = useAuth();
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState({
    from: '',
    to: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);

  const fetchActiveBuses = useCallback(async () => {
    try {
      const response = await axios.get(`${getApiBase()}/api/bus/active`);
      setBuses(response.data);
      setFilteredBuses(response.data);
    } catch (error) {
      toast.error('Failed to fetch buses');
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeSocket = useCallback(() => {
    const newSocket = io(getSocketUrl());
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('location-update', (data) => {
      setBuses(prevBuses => 
        prevBuses.map(bus => 
          bus._id === data.busId 
            ? { ...bus, currentLocation: data.location, currentCapacity: data.crowdCount }
            : bus
        )
      );
    });

    newSocket.on('crowd-update', (data) => {
      setBuses(prevBuses => 
        prevBuses.map(bus => 
          bus._id === data.busId 
            ? { ...bus, currentCapacity: data.crowdCount, crowdStatus: data.crowdStatus }
            : bus
        )
      );
      
      setFilteredBuses(prevBuses => 
        prevBuses.map(bus => 
          bus._id === data.busId 
            ? { ...bus, currentCapacity: data.crowdCount, crowdStatus: data.crowdStatus }
            : bus
        )
      );
    });

    newSocket.on('bus-capacity-update', (data) => {
      setBuses(prevBuses => 
        prevBuses.map(bus => 
          bus._id === data.busId 
            ? { 
                ...bus, 
                currentCapacity: data.currentCapacity,
                crowdStatus: data.crowdStatus,
                crowdPercentage: data.crowdPercentage
              }
            : bus
        )
      );
      
      setFilteredBuses(prevBuses => 
        prevBuses.map(bus => 
          bus._id === data.busId 
            ? { 
                ...bus, 
                currentCapacity: data.currentCapacity,
                crowdStatus: data.crowdStatus,
                crowdPercentage: data.crowdPercentage
              }
            : bus
        )
      );
    });

    newSocket.on('journey-started', () => {
      fetchActiveBuses();
    });

    newSocket.on('journey-ended', (data) => {
      setBuses(prevBuses => 
        prevBuses.filter(bus => bus._id !== data.busId)
      );
    });

    return () => newSocket.close();
  }, [fetchActiveBuses]);
  useEffect(() => {
    fetchActiveBuses();
    initializeSocket();
  }, [fetchActiveBuses, initializeSocket]);

  const handleSearch = () => {
    if (!searchQuery.from || !searchQuery.to) {
      toast.error('Please enter both start and end locations');
      return;
    }

    setIsSearching(true);

    const filtered = buses.filter(bus => {
      const route = bus.route;
      if (!route || !route.stops) return false;
      
      const fromMatch = route.stops.some(stop => 
        stop.toLowerCase().includes(searchQuery.from.toLowerCase())
      );
      const toMatch = route.stops.some(stop => 
        stop.toLowerCase().includes(searchQuery.to.toLowerCase())
      );
      
      return fromMatch && toMatch;
    });

    setFilteredBuses(filtered);
    
    if (filtered.length === 0) {
      toast.info('No buses found for this route');
    } else {
      toast.success(`Found ${filtered.length} buses for your route`);
    }
  };

  const handleSearchInputChange = (field, value) => {
    setSearchQuery(prev => ({ ...prev, [field]: value }));
    
    // If user starts typing, show they're searching
    if (value.trim() || searchQuery.from.trim() || searchQuery.to.trim()) {
      setIsSearching(true);
    } else if (!searchQuery.from.trim() && !searchQuery.to.trim()) {
      setIsSearching(false);
      setFilteredBuses([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery({ from: '', to: '' });
    setIsSearching(false);
    setFilteredBuses([]);
  };

  const joinBusRoom = (busId) => {
    if (socket) {
      socket.emit('join-bus', busId);
    }
  };

  const leaveBusRoom = (busId) => {
    if (socket) {
      socket.emit('leave-bus', busId);
    }
  };

  const calculateETA = (bus) => {
    if (!bus.journey?.estimatedArrival) {
      return 'Unknown';
    }

    const now = new Date();
    const estimatedArrival = new Date(bus.journey.estimatedArrival);
    const timeDiff = estimatedArrival - now;
    
    if (timeDiff <= 0) return 'Arriving now';
    
    const minutes = Math.ceil(timeDiff / 60000);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <h3>Finding Available Buses</h3>
        <p>Please wait while we load the latest bus information...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>Welcome back, {user?.name}! 🚌</h1>
              <p>Find and track buses in real-time • {buses.length} buses available</p>
            </div>
            <div className="header-actions">
              <div className="quick-stats">
                <div className="stat-item">
                  <span className="stat-number">{buses.filter(bus => bus.crowdStatus === 'low').length}</span>
                  <span className="stat-label">Low Crowd</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{buses.filter(bus => bus.isActive).length}</span>
                  <span className="stat-label">Active Now</span>
                </div>
              </div>
              <button 
                className="support-btn"
                onClick={() => setShowComplaintForm(true)}
              >
                <span className="btn-icon">🎧</span>
                <span>Need Help?</span>
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-sidebar">
            <BusSearch 
          onSearch={handleSearch}
          searchQuery={searchQuery}
          onSearchInputChange={handleSearchInputChange}
        />
            
            <div className="card">
              <div className="card-header">
                <h3>All Active Buses</h3>
                <span className="bus-count">{buses.length}</span>
              </div>
              <BusList
                buses={filteredBuses}
                onBusSelect={setSelectedBus}
                selectedBus={selectedBus}
                onJoinRoom={joinBusRoom}
                onLeaveRoom={leaveBusRoom}
                calculateETA={calculateETA}
              />
            </div>
          </div>

          <div className="dashboard-main">
            {selectedBus ? (
              <div className="selected-bus">
                <div className="card">
                  <div className="card-header">
                    <h3>Bus {selectedBus.busNumber}</h3>
                    <div className="bus-status">
                      <span className={`status ${selectedBus.isActive ? 'active' : 'inactive'}`}>
                        {selectedBus.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="bus-details">
                    <div className="grid grid-2">
                      <div>
                        <h4>Route Information</h4>
                        <p><strong>Route:</strong> {selectedBus.route?.name}</p>
                        <p><strong>From:</strong> {selectedBus.route?.startLocation}</p>
                        <p><strong>To:</strong> {selectedBus.route?.endLocation}</p>
                        <p><strong>Driver:</strong> {selectedBus.driverName}</p>
                        <p><strong>Conductor:</strong> {selectedBus.conductorName}</p>
                      </div>
                      <div>
                        <h4>Current Status</h4>
                        <p><strong>ETA:</strong> {calculateETA(selectedBus)}</p>
                        <p><strong>Crowd Level:</strong> 
                          <span className={`crowd-status ${selectedBus.crowdStatus?.toLowerCase()}`}>
                            {selectedBus.crowdStatus === 'low' && '🟢 Low Crowd'}
                            {selectedBus.crowdStatus === 'medium' && '🟡 Medium Crowd'}
                            {selectedBus.crowdStatus === 'high' && '🔴 High Crowd'}
                            {!selectedBus.crowdStatus && '🟢 Low'}
                          </span>
                        </p>
                        <p><strong>Last Updated:</strong> {
                          selectedBus.currentLocation?.lastUpdated 
                            ? new Date(selectedBus.currentLocation.lastUpdated).toLocaleTimeString()
                            : 'Unknown'
                        }</p>
                      </div>
                    </div>

                    <div className="bus-actions">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setShowComplaintForm(true)}
                      >
                        <span>📝</span> Report Issue
                      </button>
                    </div>

                    <BusMap bus={selectedBus} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="main-content">
                {!isSearching ? (
                  <div className="welcome-message">
                    <div className="welcome-icon">🚍</div>
                    <h2>Ready to Travel?</h2>
                    <p>Search for buses by entering your start and end locations, or select a bus from the list to track it in real-time.</p>
                    
                    <div className="features">
                      <div className="feature">
                        <div className="feature-icon">🔍</div>
                        <h3>Smart Search</h3>
                        <p>Find buses that match your route instantly</p>
                      </div>
                      <div className="feature">
                        <div className="feature-icon">📍</div>
                        <h3>Live Tracking</h3>
                        <p>See real-time location and crowd status</p>
                      </div>
                      <div className="feature">
                        <div className="feature-icon">⏰</div>
                        <h3>Smart ETA</h3>
                        <p>Get accurate arrival predictions</p>
                      </div>
                    </div>

                    <div className="quick-actions">
                      <div className="action-tip">
                        <span className="tip-icon">💡</span>
                        <span>Tip: Use the search box to find buses on your route</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="search-results">
                    <div className="search-header">
                      <h2>Search Results</h2>
                      <div className="search-info">
                        <span className="route-info">
                          {searchQuery.from} → {searchQuery.to}
                        </span>
                        <button className="clear-search-btn" onClick={clearSearch}>
                          <span>✕</span> Clear Search
                        </button>
                      </div>
                    </div>
                    
                    {filteredBuses.length > 0 ? (
                      <div className="search-results-content">
                        <p className="results-count">
                          Found {filteredBuses.length} bus{filteredBuses.length !== 1 ? 'es' : ''} for your route
                        </p>
                        <div className="results-grid">
                          {filteredBuses.map(bus => (
                            <div key={bus._id} className="result-card" onClick={() => setSelectedBus(bus)}>
                              <div className="result-header">
                                <h3>{bus.busNumber}</h3>
                                <span className={`status ${bus.isActive ? 'active' : 'inactive'}`}>
                                  {bus.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="result-details">
                                <p><strong>Route:</strong> {bus.route?.name}</p>
                                <p><strong>ETA:</strong> {calculateETA(bus)}</p>
                                <p><strong>Crowd:</strong> 
                                  <span className={`crowd-badge crowd-${bus.crowdStatus?.toLowerCase()}`}>
                                    {bus.crowdStatus}
                                  </span>
                                </p>
                              </div>
                              <button className="select-bus-btn">
                                Select Bus
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="no-results">
                        <div className="no-results-icon">🔍</div>
                        <h3>No buses found</h3>
                        <p>No buses available for the route from {searchQuery.from} to {searchQuery.to}</p>
                        <button className="try-again-btn" onClick={clearSearch}>
                          Try Different Route
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Complaint Form Modal */}
        {showComplaintForm && (
          <ComplaintForm
            onClose={() => setShowComplaintForm(false)}
            onSubmit={() => {
              toast.success('Complaint submitted successfully!');
              setShowComplaintForm(false);
            }}
          />
        )}

      </div>
    </div>
  );
};

export default CommuterDashboard;
