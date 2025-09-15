import React, { useState } from 'react';
import { toast } from 'react-toastify';

const BusCard = ({ onCreate, onCancel, user }) => {
  const [formData, setFormData] = useState({
    busNumber: '',
    driverName: user?.driverName || '',
    conductorName: user?.conductorName || '',
    route: {
      name: '',
      startLocation: '',
      endLocation: '',
      stops: [],
      distance: 0
    },
    maxCapacity: user?.maxCapacity || 50
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('route.')) {
      const routeField = name.split('.')[1];
      setFormData({
        ...formData,
        route: {
          ...formData.route,
          [routeField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleStopsChange = (e) => {
    const stops = e.target.value.split(',').map(stop => stop.trim()).filter(stop => stop);
    setFormData({
      ...formData,
      route: {
        ...formData.route,
        stops
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.busNumber || !formData.driverName || !formData.conductorName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.route.name || !formData.route.startLocation || !formData.route.endLocation) {
      toast.error('Please fill in all route information');
      return;
    }

    onCreate(formData);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Create New Bus</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="bus-form">
        <div className="form-group">
          <label htmlFor="busNumber" className="form-label">Bus Number *</label>
          <input
            type="text"
            id="busNumber"
            name="busNumber"
            value={formData.busNumber}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., BT-001"
            required
          />
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label htmlFor="driverName" className="form-label">Driver Name *</label>
            <input
              type="text"
              id="driverName"
              name="driverName"
              value={formData.driverName}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="conductorName" className="form-label">Conductor Name *</label>
            <input
              type="text"
              id="conductorName"
              name="conductorName"
              value={formData.conductorName}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="maxCapacity" className="form-label">Maximum Capacity</label>
          <input
            type="number"
            id="maxCapacity"
            name="maxCapacity"
            value={formData.maxCapacity}
            onChange={handleChange}
            className="form-input"
            min="1"
            required
          />
        </div>

        <div className="route-section">
          <h4>Route Information</h4>
          
          <div className="form-group">
            <label htmlFor="route.name" className="form-label">Route Name *</label>
            <input
              type="text"
              id="route.name"
              name="route.name"
              value={formData.route.name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Downtown Express"
              required
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="route.startLocation" className="form-label">Start Location *</label>
              <input
                type="text"
                id="route.startLocation"
                name="route.startLocation"
                value={formData.route.startLocation}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Central Station"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="route.endLocation" className="form-label">End Location *</label>
              <input
                type="text"
                id="route.endLocation"
                name="route.endLocation"
                value={formData.route.endLocation}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Airport Terminal"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="route.distance" className="form-label">Distance (km)</label>
            <input
              type="number"
              id="route.distance"
              name="route.distance"
              value={formData.route.distance}
              onChange={handleChange}
              className="form-input"
              min="0"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="stops" className="form-label">Bus Stops</label>
            <input
              type="text"
              id="stops"
              name="stops"
              value={formData.route.stops.join(', ')}
              onChange={handleStopsChange}
              className="form-input"
              placeholder="e.g., Stop 1, Stop 2, Stop 3"
            />
            <small className="form-help">Separate stops with commas</small>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create Bus
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusCard;
