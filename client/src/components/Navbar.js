import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'bus_operator':
        return '/bus-operator';
      case 'commuter':
        return '/commuter';
      case 'admin':
        return '/admin';
      default:
        return '/login';
    }
  };

  const getRoleDisplay = () => {
    if (!user) return '';
    
    switch (user.role) {
      case 'bus_operator':
        return 'Bus Operator';
      case 'commuter':
        return 'Commuter';
      case 'admin':
        return 'Admin';
      default:
        return '';
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            🚌 Bus Tracker
          </Link>
          
          <div className="navbar-menu">
            {user ? (
              <>
                <Link to={getDashboardLink()} className="navbar-link">
                  Dashboard
                </Link>
                <div className="navbar-user">
                  <span className="user-role">{getRoleDisplay()}</span>
                  <span className="user-email">{user.email}</span>
                  <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar-link">
                  Login
                </Link>
                <Link to="/register" className="navbar-link">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
