import React from 'react';

const BusList = ({ buses, onBusSelect, selectedBus, onJoinRoom, onLeaveRoom, calculateETA }) => {
  const handleBusClick = (bus) => {
    if (selectedBus?._id === bus._id) {
      onBusSelect(null);
      onLeaveRoom(bus._id);
    } else {
      onBusSelect(bus);
      onJoinRoom(bus._id);
    }
  };

  const getCrowdColor = (crowdStatus) => {
    switch (crowdStatus?.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      default: return 'secondary';
    }
  };

  if (buses.length === 0) {
    return (
      <div className="no-data-container">
        <div className="no-data-icon">🚌</div>
        <h3>No Buses Available</h3>
        <p>No buses found matching your search criteria. Try adjusting your search or check back later.</p>
      </div>
    );
  }

  return (
    <div className="bus-list">
      {buses.map(bus => (
        <div
          key={bus._id}
          className={`bus-item ${selectedBus?._id === bus._id ? 'active' : ''} ${!bus.isActive ? 'inactive' : ''}`}
          onClick={() => handleBusClick(bus)}
        >
          <div className="bus-header">
            <div className="bus-number-section">
              <div className="bus-icon">🚌</div>
              <div>
                <h4>{bus.busNumber}</h4>
                <span className="driver-name">👨‍✈️ {bus.driverName}</span>
              </div>
            </div>
            <div className="status-badges">
              <span className={`status-badge ${bus.isActive ? 'active' : 'inactive'}`}>
                {bus.isActive ? '🟢 Live' : '🔴 Offline'}
              </span>
              <span className={`crowd-badge crowd-${bus.crowdStatus?.toLowerCase() || 'unknown'}`}>
                {bus.crowdStatus === 'low' && '🟢'}
                {bus.crowdStatus === 'medium' && '🟡'}
                {bus.crowdStatus === 'high' && '🔴'}
                {!bus.crowdStatus && '⚪'}
                {bus.crowdStatus || 'Unknown'}
              </span>
            </div>
          </div>
          
          <div className="bus-route">
            <div className="route-header">
              <span className="route-name">📍 {bus.route?.name}</span>
              <span className="eta-badge">{calculateETA(bus)}</span>
            </div>
            <div className="route-path">
              <span className="start-location">{bus.route?.startLocation}</span>
              <span className="route-arrow">→</span>
              <span className="end-location">{bus.route?.endLocation}</span>
            </div>
          </div>

          <div className="bus-metrics">
            <div className="metric-item">
              <div className="metric-icon">👥</div>
              <div className="metric-info">
                <span className={`crowd-level crowd-${bus.crowdStatus?.toLowerCase() || 'unknown'}`}>
                  {bus.crowdStatus === 'low' && '🟢 Low Crowd'}
                  {bus.crowdStatus === 'medium' && '🟡 Medium Crowd'}
                  {bus.crowdStatus === 'high' && '🔴 High Crowd'}
                  {!bus.crowdStatus && '⚪ Unknown'}
                </span>
                <span className="metric-label">Crowd Level</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">📏</div>
              <div className="metric-info">
                <span className="metric-value">{bus.route?.distance || 'N/A'} km</span>
                <span className="metric-label">Distance</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">🚏</div>
              <div className="metric-info">
                <span className="metric-value">{bus.route?.stops?.length || 0}</span>
                <span className="metric-label">Stops</span>
              </div>
            </div>
          </div>

          <div className="bus-actions">
            <button className={`track-btn ${selectedBus?._id === bus._id ? 'tracking' : ''}`}>
              {selectedBus?._id === bus._id ? (
                <>
                  <span className="pulse-dot"></span>
                  Tracking Live
                </>
              ) : (
                <>
                  <span className="track-icon">📍</span>
                  Track Bus
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BusList;
