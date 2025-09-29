import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getApiBase } from '../config';

const TicketGenerator = ({ bus, onTicketGenerated }) => {
  const [passengerName, setPassengerName] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastGeneratedTicket, setLastGeneratedTicket] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, [bus._id]);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${getApiBase()}/api/ticket/bus/${bus._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  const generateTicket = async (e) => {
    e.preventDefault();
    
    if (!passengerName.trim()) {
      toast.error('Please enter passenger name');
      return;
    }

    if (!bus.isActive || !bus.isOnRoute) {
      toast.error('Bus must be active and on route to generate tickets');
      return;
    }

    if (bus.currentCapacity >= bus.maxCapacity) {
      toast.error('Bus is at full capacity');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${getApiBase()}/api/ticket/generate`, {
        busId: bus._id,
        passengerName: passengerName.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success(`Ticket generated: ${response.data.ticket.ticketId}`);
      setLastGeneratedTicket(response.data.ticket);
      setPassengerName('');
      fetchTickets();
      onTicketGenerated();
      
      // Clear the last generated ticket after 5 seconds
      setTimeout(() => setLastGeneratedTicket(null), 5000);
    } catch (error) {
      console.error('Ticket generation error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate ticket');
    } finally {
      setLoading(false);
    }
  };

  const getCrowdStatus = () => {
    const percentage = bus.crowdPercentage || 0;
    if (percentage < 30) return { status: 'Low', color: 'success' };
    if (percentage < 70) return { status: 'Medium', color: 'warning' };
    return { status: 'High', color: 'danger' };
  };

  const crowdInfo = getCrowdStatus();

  return (
    <div className="ticket-generator">
      <div className="card">
        <div className="card-header">
          <h3>Ticket Generator</h3>
          <div className="crowd-info">
            <span className={`crowd-status ${crowdInfo.color}`}>
              {crowdInfo.status === 'Low' && '🟢 Low Crowd'}
              {crowdInfo.status === 'Medium' && '🟡 Medium Crowd'}
              {crowdInfo.status === 'High' && '🔴 High Crowd'}
            </span>
          </div>
        </div>

        <div className="ticket-form">
          <div className="bus-status-info">
            <div className="status-item">
              <span className="label">Bus Status:</span>
              <span className={`value ${bus.isActive ? 'active' : 'inactive'}`}>
                {bus.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">On Route:</span>
              <span className={`value ${bus.isOnRoute ? 'active' : 'inactive'}`}>
                {bus.isOnRoute ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Crowd Level:</span>
              <span className={`value crowd-${crowdInfo.status.toLowerCase()}`}>
                {crowdInfo.status === 'Low' && '🟢 Low Crowd'}
                {crowdInfo.status === 'Medium' && '🟡 Medium Crowd'}
                {crowdInfo.status === 'High' && '🔴 High Crowd'}
              </span>
            </div>
          </div>

          <form onSubmit={generateTicket}>
            <div className="form-group">
              <label htmlFor="passengerName" className="form-label">Passenger Name</label>
              <div className="input-group">
                <input
                  type="text"
                  id="passengerName"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="form-input"
                  placeholder="Enter passenger name"
                  disabled={!bus.isActive || !bus.isOnRoute || bus.currentCapacity >= bus.maxCapacity}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !bus.isActive || !bus.isOnRoute || bus.currentCapacity >= bus.maxCapacity}
                >
                  {loading ? 'Generating...' : 'Generate Ticket'}
                </button>
              </div>
            </div>
          </form>

          {!bus.isActive && (
            <div className="alert alert-warning">
              <strong>Bus is not active!</strong> Start the journey to generate tickets.
            </div>
          )}

          {bus.isActive && !bus.isOnRoute && (
            <div className="alert alert-warning">
              <strong>Bus is not on route!</strong> Start the journey to generate tickets.
            </div>
          )}

          {bus.isActive && bus.isOnRoute && bus.currentCapacity >= bus.maxCapacity && (
            <div className="alert alert-warning">
              <strong>Bus is at full capacity!</strong> Cannot generate more tickets.
            </div>
          )}
        </div>

        {lastGeneratedTicket && (
          <div className="ticket-preview">
            <div className="card">
              <div className="card-header">
                <h4>🎫 Ticket Generated Successfully!</h4>
              </div>
              <div className="ticket-details">
                <div className="ticket-info">
                  <div className="ticket-id-large">{lastGeneratedTicket.ticketId}</div>
                  <div className="passenger-info">
                    <strong>Passenger:</strong> {lastGeneratedTicket.passengerName}
                  </div>
                  <div className="bus-info">
                    <strong>Bus:</strong> {lastGeneratedTicket.busNumber}
                  </div>
                  <div className="route-info">
                    <strong>Route:</strong> {lastGeneratedTicket.route}
                  </div>
                  <div className="time-info">
                    <strong>Issued:</strong> {new Date(lastGeneratedTicket.issuedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="tickets-list">
          <h4>Recent Tickets ({tickets.length})</h4>
          <div className="tickets-container">
            {tickets.length === 0 ? (
              <p className="no-tickets">No tickets generated yet</p>
            ) : (
              tickets.slice(0, 10).map((ticket, index) => (
                <div key={ticket._id} className="ticket-item">
                  <div className="ticket-info">
                    <span className="ticket-id">{ticket.ticketId}</span>
                    <span className="passenger-name">{ticket.passengerName}</span>
                  </div>
                  <div className="ticket-time">
                    {new Date(ticket.issuedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketGenerator;
