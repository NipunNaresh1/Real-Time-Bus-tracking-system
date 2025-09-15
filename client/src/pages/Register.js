import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'commuter',
    driverName: '',
    conductorName: '',
    maxCapacity: '',
    routes: [{ name: '', startLocation: '', endLocation: '', stops: [], distance: 0 }]
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRouteChange = (index, field, value) => {
    const newRoutes = [...formData.routes];
    newRoutes[index][field] = value;
    setFormData({
      ...formData,
      routes: newRoutes
    });
  };

  const addRoute = () => {
    setFormData({
      ...formData,
      routes: [...formData.routes, { name: '', startLocation: '', endLocation: '', stops: [], distance: 0 }]
    });
  };

  const removeRoute = (index) => {
    if (formData.routes.length > 1) {
      const newRoutes = formData.routes.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        routes: newRoutes
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    const userData = {
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
      ...(formData.role === 'bus_operator' && {
        driverName: formData.driverName,
        conductorName: formData.conductorName,
        maxCapacity: parseInt(formData.maxCapacity),
        routes: formData.routes.filter(route => route.name && route.startLocation && route.endLocation)
      })
    };

    const result = await register(userData);
    
    if (result.success) {
      toast.success('Registration successful!');
      // Navigate based on user role
      switch (formData.role) {
        case 'bus_operator':
          navigate('/bus-operator');
          break;
        case 'commuter':
          navigate('/commuter');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
    } else {
      toast.error(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Register</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="role" className="form-label">Account Type</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="commuter">Commuter</option>
              <option value="bus_operator">Bus Operator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {formData.role === 'bus_operator' && (
            <>
              <div className="form-group">
                <label htmlFor="driverName" className="form-label">Driver Name</label>
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
                <label htmlFor="conductorName" className="form-label">Conductor Name</label>
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

              <div className="form-group">
                <label htmlFor="maxCapacity" className="form-label">Maximum Bus Capacity</label>
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

              <div className="form-group">
                <label className="form-label">Routes</label>
                {formData.routes.map((route, index) => (
                  <div key={index} className="route-form">
                    <div className="grid grid-2">
                      <input
                        type="text"
                        placeholder="Route Name"
                        value={route.name}
                        onChange={(e) => handleRouteChange(index, 'name', e.target.value)}
                        className="form-input"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Distance (km)"
                        value={route.distance}
                        onChange={(e) => handleRouteChange(index, 'distance', parseInt(e.target.value))}
                        className="form-input"
                        min="0"
                        required
                      />
                    </div>
                    <div className="grid grid-2">
                      <input
                        type="text"
                        placeholder="Start Location"
                        value={route.startLocation}
                        onChange={(e) => handleRouteChange(index, 'startLocation', e.target.value)}
                        className="form-input"
                        required
                      />
                      <input
                        type="text"
                        placeholder="End Location"
                        value={route.endLocation}
                        onChange={(e) => handleRouteChange(index, 'endLocation', e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Stops (comma separated)"
                        value={route.stops.join(', ')}
                        onChange={(e) => handleRouteChange(index, 'stops', e.target.value.split(',').map(s => s.trim()))}
                        className="form-input"
                      />
                    </div>
                    {formData.routes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRoute(index)}
                        className="btn btn-danger btn-sm"
                      >
                        Remove Route
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRoute}
                  className="btn btn-secondary btn-sm"
                >
                  Add Route
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
