import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const LocationTracker = ({ bus, onLocationUpdate }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [hasShownError, setHasShownError] = useState(false);

  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const handleLaptopLocation = () => {
    // Use a default laptop location (Delhi area for demo)
    const laptopLocation = {
      latitude: 28.6139 + (Math.random() - 0.5) * 0.01, // Small random offset
      longitude: 77.2090 + (Math.random() - 0.5) * 0.01,
      address: 'Laptop Location (Simulated)'
    };
    
    setCurrentLocation(laptopLocation);
    onLocationUpdate(laptopLocation);
    setIsTracking(true);
    toast.success('Using laptop location for tracking');
    
    // Set up interval to simulate movement
    const intervalId = setInterval(() => {
      const newLocation = {
        latitude: laptopLocation.latitude + (Math.random() - 0.5) * 0.001,
        longitude: laptopLocation.longitude + (Math.random() - 0.5) * 0.001,
        address: 'Laptop Location (Moving)'
      };
      setCurrentLocation(newLocation);
      onLocationUpdate(newLocation);
    }, 5000); // Update every 5 seconds
    
    setWatchId(intervalId);
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported. Using laptop location...');
      handleLaptopLocation();
      return;
    }

    setHasShownError(false);
    setIsTracking(true);
    toast.info('Getting your location...');
    
    // First, get current position to test permissions
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: 'Current Location'
        };
        
        setCurrentLocation(location);
        onLocationUpdate(location);
        toast.success('Location tracking started successfully');
        
        // Now start watching position
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: 'Current Location'
            };
            
            setCurrentLocation(newLocation);
            onLocationUpdate(newLocation);
          },
          (error) => {
            console.error('Watch position error:', error);
            // Only show error once, not repeatedly
            if (!hasShownError) {
              if (error.code === error.PERMISSION_DENIED) {
                toast.error('Location access denied. Please allow location permissions.');
                setIsTracking(false);
                setHasShownError(true);
              } else if (error.code === error.POSITION_UNAVAILABLE) {
                // Don't show repeated unavailable errors
                console.log('Position unavailable, retrying...');
              } else if (error.code === error.TIMEOUT) {
                console.log('Location timeout, retrying...');
              }
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
          }
        );
        
        setWatchId(id);
      },
      (error) => {
        console.error('Initial location error:', error);
        
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location access denied. Please allow location permissions in your browser.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.warning('GPS unavailable. Using laptop location...');
          handleLaptopLocation();
          return;
        } else if (error.code === error.TIMEOUT) {
          toast.warning('Location timeout. Using laptop location...');
          handleLaptopLocation();
          return;
        }
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );
  };

  const stopTracking = () => {
    if (watchId) {
      if (typeof watchId === 'number' && watchId > 1000) {
        // It's an interval ID, clear interval
        clearInterval(watchId);
      } else {
        // It's a geolocation watch ID, clear watch
        navigator.geolocation.clearWatch(watchId);
      }
      setWatchId(null);
    }
    setIsTracking(false);
    setCurrentLocation(null);
    setHasShownError(false);
    toast.info('Location tracking stopped');
  };

  const updateLocationManually = () => {
    if (!currentLocation) {
      toast.error('No location available to update');
      return;
    }
    
    onLocationUpdate(currentLocation);
    toast.success('Location updated successfully');
  };

  return (
    <div className="location-tracker">
      <div className="card">
        <div className="card-header">
          <h3>Location Tracker</h3>
          <div className="tracking-controls">
            {!isTracking ? (
              <>
                <button
                  className="btn btn-success"
                  onClick={startTracking}
                >
                  Start Tracking
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleLaptopLocation}
                  style={{ marginLeft: '10px' }}
                >
                  Use Laptop Location
                </button>
              </>
            ) : (
              <button
                className="btn btn-danger"
                onClick={stopTracking}
              >
                Stop Tracking
              </button>
            )}
          </div>
        </div>

        <div className="location-info">
          {currentLocation ? (
            <div className="location-details">
              <div className="location-coords">
                <p><strong>Latitude:</strong> {currentLocation.latitude.toFixed(6)}</p>
                <p><strong>Longitude:</strong> {currentLocation.longitude.toFixed(6)}</p>
                <p><strong>Accuracy:</strong> Available</p>
              </div>
              
              <div className="location-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={updateLocationManually}
                >
                  Update Location
                </button>
              </div>
            </div>
          ) : (
            <div className="no-location">
              <p>📍 Location not available</p>
              <p>Click "Start Tracking" and allow location permissions when prompted</p>
              {isTracking && (
                <p className="waiting-location">⏳ Waiting for GPS signal...</p>
              )}
            </div>
          )}
        </div>

        {isTracking && currentLocation && (
          <div className="tracking-status">
            <div className="status-indicator active">
              <span className="status-dot"></span>
              <span>Tracking active - Location acquired</span>
            </div>
          </div>
        )}
        
        {isTracking && !currentLocation && (
          <div className="tracking-status">
            <div className="status-indicator waiting">
              <span className="status-dot waiting"></span>
              <span>Acquiring GPS signal...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationTracker;
