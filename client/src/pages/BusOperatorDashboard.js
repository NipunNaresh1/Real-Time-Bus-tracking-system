import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import io from 'socket.io-client';
import { getSocketUrl, getApiBase } from '../config';
import BusCard from '../components/BusCard';
import TicketGenerator from '../components/TicketGenerator';
import LocationTracker from '../components/LocationTracker';
import './Dashboard.css';

const BusOperatorDashboard = () => {
  const { user } = useAuth();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState(null);

  useEffect(() => {
    fetchBuses();
    initializeSocket();
  }, []);

  const fetchBuses = async () => {
    try {
      const response = await axios.get(`${getApiBase()}/api/bus/my-buses`);
      setBuses(response.data);
    } catch (error) {
      toast.error('Failed to fetch buses');
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    const newSocket = io(getSocketUrl(), {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => newSocket.close();
  };

  const createBus = async (busData) => {
    try {
      const response = await axios.post(`${getApiBase()}/api/bus/create`, busData);
      setBuses([...buses, response.data.bus]);
      toast.success('Bus created successfully');
    } catch (error) {
      toast.error('Failed to create bus');
    }
  };

  const startJourney = async (busId) => {
    try {
      await axios.post(`${getApiBase()}/api/bus/${busId}/start-journey`);
      await fetchBuses();
      toast.success('Journey started successfully');
    } catch (error) {
      toast.error('Failed to start journey');
    }
  };

  const endJourney = async (busId) => {
    try {
      await axios.post(`${getApiBase()}/api/bus/${busId}/end-journey`);
      await fetchBuses();
      toast.success('Journey ended successfully');
    } catch (error) {
      toast.error('Failed to end journey');
    }
  };

  const updateLocation = async (busId, location) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${getApiBase()}/api/bus/${busId}/update-location`, {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || 'Current Location'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local bus state
      setBuses(prevBuses => 
        prevBuses.map(bus => 
          bus._id === busId 
            ? { ...bus, currentLocation: { ...location, lastUpdated: new Date() } }
            : bus
        )
      );
      
      if (selectedBus && selectedBus._id === busId) {
        setSelectedBus(prev => ({
          ...prev,
          currentLocation: { ...location, lastUpdated: new Date() }
        }));
      }
      
      toast.success('Location updated successfully');
    } catch (error) {
      console.error('Location update error:', error);
      toast.error('Failed to update location');
    }
  };

  if (loading) {
    return <div className="loading">Loading your buses...</div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Bus Operator Dashboard</h1>
          <p>Welcome back, {user?.driverName || user?.email}</p>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-sidebar">
            <div className="card">
              <div className="card-header">
                <h3>My Buses</h3>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setSelectedBus('new')}
                >
                  Add Bus
                </button>
              </div>
              <div className="bus-list">
                {buses.map(bus => (
                  <div
                    key={bus._id}
                    className={`bus-item ${selectedBus?._id === bus._id ? 'active' : ''}`}
                    onClick={() => setSelectedBus(bus)}
                  >
                    <div className="bus-info">
                      <h4>{bus.busNumber}</h4>
                      <p>{bus.route?.name}</p>
                      <span className={`status ${bus.isActive ? 'active' : 'inactive'}`}>
                        {bus.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-main">
            {selectedBus === 'new' ? (
              <BusCard
                onCreate={createBus}
                onCancel={() => setSelectedBus(null)}
                user={user}
              />
            ) : selectedBus ? (
              <div className="selected-bus">
                <div className="card">
                  <div className="card-header">
                    <h3>Bus {selectedBus.busNumber}</h3>
                    <div className="bus-actions">
                      {!selectedBus.isActive ? (
                        <button
                          className="btn btn-success"
                          onClick={() => startJourney(selectedBus._id)}
                        >
                          Start Journey
                        </button>
                      ) : (
                        <button
                          className="btn btn-danger"
                          onClick={() => endJourney(selectedBus._id)}
                        >
                          End Journey
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bus-details">
                    <div className="grid grid-2">
                      <div>
                        <h4>Route Information</h4>
                        <p><strong>Route:</strong> {selectedBus.route?.name}</p>
                        <p><strong>From:</strong> {selectedBus.route?.startLocation}</p>
                        <p><strong>To:</strong> {selectedBus.route?.endLocation}</p>
                        <p><strong>Distance:</strong> {selectedBus.route?.distance} km</p>
                      </div>
                      <div>
                        <h4>Capacity</h4>
                        <p><strong>Current:</strong> {selectedBus.currentCapacity}</p>
                        <p><strong>Maximum:</strong> {selectedBus.maxCapacity}</p>
                        <p><strong>Crowd Level:</strong> 
                          <span className={`crowd-status ${selectedBus.crowdStatus?.toLowerCase()}`}>
                            {selectedBus.crowdStatus === 'low' && '🟢 Low Crowd'}
                            {selectedBus.crowdStatus === 'medium' && '🟡 Medium Crowd'}
                            {selectedBus.crowdStatus === 'high' && '🔴 High Crowd'}
                            {!selectedBus.crowdStatus && '⚪ Unknown'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {selectedBus.isActive && (
                      <>
                        <LocationTracker
                          bus={selectedBus}
                          onLocationUpdate={(location) => updateLocation(selectedBus._id, location)}
                        />
                        <TicketGenerator
                          bus={selectedBus}
                          onTicketGenerated={() => fetchBuses()}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="welcome-message">
                <h2>Welcome to Bus Tracker</h2>
                <p>Select a bus from the sidebar to manage it, or create a new bus to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusOperatorDashboard;
