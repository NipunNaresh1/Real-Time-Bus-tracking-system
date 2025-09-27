import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import { getSocketUrl } from '../config';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const BusMap = ({ bus }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([28.6139, 77.2090], 13); // Default to Delhi
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !bus?.currentLocation?.latitude || !bus?.currentLocation?.longitude) return;

    const { latitude, longitude } = bus.currentLocation;
    
    // Remove existing marker
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
    }

    // Add new marker
    const busIcon = L.divIcon({
      className: 'bus-marker',
      html: '🚌',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    markerRef.current = L.marker([latitude, longitude], { icon: busIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`
        <div class="bus-popup">
          <h4>Bus ${bus.busNumber}</h4>
          <p><strong>Route:</strong> ${bus.route?.name}</p>
          <p><strong>Driver:</strong> ${bus.driverName}</p>
          <p><strong>Crowd:</strong> ${bus.currentCapacity}/${bus.maxCapacity}</p>
          <p><strong>Status:</strong> ${bus.crowdStatus}</p>
        </div>
      `);

    // Center map on bus location
    mapInstanceRef.current.setView([latitude, longitude], 15);
  }, [bus?.currentLocation]);

  // Real-time location updates via socket
  useEffect(() => {
    if (!bus || !mapInstanceRef.current) return;

    const socket = io(getSocketUrl(), {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    // Join specific bus room
    socket.emit('join-bus', bus._id);

    // Listen to generic location-update from server room
    socket.on('location-update', (data) => {
      // Optional guard if multiple updates come through
      if (!data || (data.busId && data.busId !== bus._id)) return;
      const { location, latitude, longitude } = data;
      const lat = location?.latitude ?? latitude;
      const lon = location?.longitude ?? longitude;
      if (typeof lat !== 'number' || typeof lon !== 'number') return;

      const busIcon = L.divIcon({
        className: 'bus-marker',
        html: '🚌',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      markerRef.current = L.marker([lat, lon], { icon: busIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="bus-popup">
            <h4>Bus ${bus.busNumber}</h4>
            <p><strong>Route:</strong> ${bus.route?.name || 'Unknown'}</p>
            <p><strong>Driver:</strong> ${bus.driverName || 'Unknown'}</p>
            <p><strong>Status:</strong> Live Location</p>
            <p><strong>Updated:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
        `);

      mapInstanceRef.current.setView([lat, lon], 15);
    });

    return () => {
      socket.emit('leave-bus', bus._id);
      socket.off('location-update');
      socket.close();
    };
  }, [bus]);

  if (!bus) {
    return (
      <div className="map-container">
        <div className="no-location">
          <p>📍 No bus selected</p>
          <p>Select a bus to view its location</p>
        </div>
      </div>
    );
  }

  if (!bus.currentLocation?.latitude || !bus.currentLocation?.longitude) {
    return (
      <div className="map-container">
        <div className="no-location">
          <p>📍 GPS location not available</p>
          <p>Bus operator needs to start location tracking</p>
          <div className="location-instructions">
            <h4>For Bus Operators:</h4>
            <ol>
              <li>Go to Bus Operator Dashboard</li>
              <li>Select your bus</li>
              <li>Click "Start Tracking" in Location Tracker</li>
              <li>Allow GPS permissions when prompted</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div className="map-header">
        <h4>Live Bus Location</h4>
        <div className="location-info">
          <span className="coordinates">
            {bus.currentLocation.latitude.toFixed(6)}, {bus.currentLocation.longitude.toFixed(6)}
          </span>
          <span className="last-updated">
            Updated: {bus.currentLocation.lastUpdated 
              ? new Date(bus.currentLocation.lastUpdated).toLocaleTimeString()
              : 'Unknown'
            }
          </span>
        </div>
      </div>
      <div ref={mapRef} className="map" style={{ height: '400px', width: '100%' }} />
    </div>
  );
};

export default BusMap;
