import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchRevenueData();
    fetchComplaints();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async (period = '7') => {
    try {
      const response = await axios.get(`/api/admin/revenue?period=${period}`);
      setRevenueData(response.data);
    } catch (error) {
      toast.error('Failed to fetch revenue data');
    }
  };

  const fetchComplaints = async () => {
    setComplaintsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4600/api/complaint/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data.complaints || []);
    } catch (error) {
      toast.error('Failed to fetch complaints');
    } finally {
      setComplaintsLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId, status, response = '') => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:4600/api/complaint/${complaintId}/status`, {
        status,
        response
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        toast.success('Complaint updated successfully');
        fetchComplaints(); // Refresh complaints list
        setSelectedComplaint(null);
        setResponseText('');
      }
    } catch (error) {
      toast.error('Failed to update complaint');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#dc3545';
      case 'in_progress': return '#ffc107';
      case 'resolved': return '#28a745';
      case 'closed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!dashboardData) {
    return <div className="error">Failed to load dashboard data</div>;
  }

  return (
    <>
      <div className="dashboard">
        <div className="container">
          <div className="dashboard-header">
            <h1>Admin Dashboard</h1>
            <p>System overview and analytics</p>
          </div>

          <div className="dashboard-content">
          {/* Overview Cards */}
          <div className="overview-cards">
            <div className="card">
              <div className="card-header">
                <h3>Total Buses</h3>
              </div>
              <div className="card-content">
                <div className="stat-number">{dashboardData.overview.totalBuses}</div>
                <div className="stat-label">Active: {dashboardData.overview.activeBuses}</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Total Users</h3>
              </div>
              <div className="card-content">
                <div className="stat-number">{dashboardData.overview.totalUsers}</div>
                <div className="stat-label">
                  Operators: {dashboardData.overview.busOperators} | 
                  Commuters: {dashboardData.overview.commuters}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Today's Tickets</h3>
              </div>
              <div className="card-content">
                <div className="stat-number">{dashboardData.overview.totalTicketsToday}</div>
                <div className="stat-label">Tickets sold today</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Today's Revenue</h3>
              </div>
              <div className="card-content">
                <div className="stat-number">₹{dashboardData.overview.totalRevenueToday}</div>
                <div className="stat-label">Revenue generated today</div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            <div className="card">
              <div className="card-header">
                <h3>Revenue Analytics</h3>
                <div className="chart-controls">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => fetchRevenueData('7')}
                  >
                    7 Days
                  </button>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => fetchRevenueData('30')}
                  >
                    30 Days
                  </button>
                </div>
              </div>
              <div className="chart-container">
                {revenueData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>User Distribution</h3>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Bus Operators', value: dashboardData.overview.busOperators },
                        { name: 'Commuters', value: dashboardData.overview.commuters }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Active Journeys */}
          <div className="card">
            <div className="card-header">
              <h3>Active Journeys</h3>
              <span className="journey-count">{dashboardData.activeJourneys.length}</span>
            </div>
            <div className="journeys-list">
              {dashboardData.activeJourneys.length === 0 ? (
                <p className="no-journeys">No active journeys</p>
              ) : (
                <div className="journeys-grid">
                  {dashboardData.activeJourneys.map(journey => (
                    <div key={journey._id} className="journey-item">
                      <div className="journey-header">
                        <h4>{journey.busNumber}</h4>
                        <span className={`status ${journey.isActive ? 'active' : 'inactive'}`}>
                          {journey.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="journey-details">
                        <p><strong>Route:</strong> {journey.route?.name}</p>
                        <p><strong>Driver:</strong> {journey.driverName}</p>
                        <p><strong>Crowd:</strong> 
                          <span className={`crowd-status ${journey.crowdStatus?.toLowerCase()}`}>
                            {journey.currentCapacity}/{journey.maxCapacity} ({journey.crowdStatus})
                          </span>
                        </p>
                        <p><strong>Started:</strong> {
                          journey.journey?.startTime 
                            ? new Date(journey.journey.startTime).toLocaleTimeString()
                            : 'Unknown'
                        }</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Complaint Management Section */}
          <div className="card">
              <div className="admin-section">
                <div className="section-header">
                  <h2>📋 Complaint Management</h2>
                  <div className="complaint-stats">
                    <span className="stat-badge open">
                      <span className="stat-number">{complaints.filter(c => c.status === 'open').length}</span>
                      <span className="stat-label">Open</span>
                    </span>
                    <span className="stat-badge progress">
                      <span className="stat-number">{complaints.filter(c => c.status === 'in_progress').length}</span>
                      <span className="stat-label">In Progress</span>
                    </span>
                    <span className="stat-badge resolved">
                      <span className="stat-number">{complaints.filter(c => c.status === 'resolved').length}</span>
                      <span className="stat-label">Resolved</span>
                    </span>
                    <span className="stat-badge closed">
                      <span className="stat-number">{complaints.filter(c => c.status === 'closed').length}</span>
                      <span className="stat-label">Closed</span>
                    </span>
                  </div>
                </div>
                <div className="complaints-grid">
                  {complaints.map(complaint => (
                    <div key={complaint._id} className="complaint-item">
                      <div className="complaint-header">
                        <div>
                          <h4>{complaint.subject}</h4>
                          <p className="complaint-user">By: {complaint.userId?.name} ({complaint.userId?.email})</p>
                        </div>
                        <div className="complaint-badges">
                          <span 
                            className="priority-badge" 
                            style={{ backgroundColor: getPriorityColor(complaint.priority) }}
                          >
                            {complaint.priority.toUpperCase()}
                          </span>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(complaint.status) }}
                          >
                            {complaint.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="complaint-details">
                        <p><strong>Category:</strong> {complaint.category.replace('_', ' ')}</p>
                        {complaint.busId && (
                          <p><strong>Bus:</strong> {complaint.busId.busNumber}</p>
                        )}
                        <p><strong>Description:</strong> {complaint.description}</p>
                        <p><strong>Created:</strong> {new Date(complaint.createdAt).toLocaleString()}</p>
                        
                        {complaint.adminResponse?.message && (
                          <div className="admin-response">
                            <strong>Admin Response:</strong>
                            <p>{complaint.adminResponse.message}</p>
                            <small>
                              Responded by {complaint.adminResponse.respondedBy?.name} on{' '}
                              {new Date(complaint.adminResponse.respondedAt).toLocaleString()}
                            </small>
                          </div>
                        )}
                      </div>

                      <div className="complaint-actions">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => setSelectedComplaint(complaint)}
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="card">
            <div className="card-header">
              <h3>Recent Tickets</h3>
            </div>
            <div className="tickets-table">
              {dashboardData.recentTickets.length === 0 ? (
                <p className="no-tickets">No recent tickets</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Passenger</th>
                      <th>Bus</th>
                      <th>Route</th>
                      <th>Issued At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentTickets.map(ticket => (
                      <tr key={ticket._id}>
                        <td>{ticket.ticketId}</td>
                        <td>{ticket.passengerName}</td>
                        <td>{ticket.busId?.busNumber}</td>
                        <td>{ticket.busId?.route?.name}</td>
                        <td>{new Date(ticket.issuedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Complaint Management Modal */}
        {selectedComplaint && (
          <div className="complaint-modal-overlay">
            <div className="complaint-modal">
              <div className="complaint-modal-header">
                <h3>Manage Complaint</h3>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedComplaint(null)}
                >
                  ×
                </button>
              </div>

              <div className="complaint-modal-content">
                <div className="complaint-info">
                  <h4>{selectedComplaint.subject}</h4>
                  <p><strong>From:</strong> {selectedComplaint.userId?.name} ({selectedComplaint.userId?.email})</p>
                  <p><strong>Category:</strong> {selectedComplaint.category.replace('_', ' ')}</p>
                  <p><strong>Priority:</strong> 
                    <span 
                      className="priority-badge" 
                      style={{ backgroundColor: getPriorityColor(selectedComplaint.priority) }}
                    >
                      {selectedComplaint.priority.toUpperCase()}
                    </span>
                  </p>
                  <p><strong>Current Status:</strong> 
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(selectedComplaint.status) }}
                    >
                      {selectedComplaint.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </p>
                  {selectedComplaint.busId && (
                    <p><strong>Bus:</strong> {selectedComplaint.busId.busNumber}</p>
                  )}
                  <p><strong>Description:</strong></p>
                  <div className="complaint-description">
                    {selectedComplaint.description}
                  </div>
                </div>

                <div className="status-update-section">
                  <h4>Update Status & Response</h4>
                  
                  <div className="status-buttons">
                    <button 
                      className="btn btn-warning"
                      onClick={() => updateComplaintStatus(selectedComplaint._id, 'in_progress')}
                    >
                      Mark In Progress
                    </button>
                    <button 
                      className="btn btn-success"
                      onClick={() => updateComplaintStatus(selectedComplaint._id, 'resolved', responseText)}
                    >
                      Mark Resolved
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => updateComplaintStatus(selectedComplaint._id, 'closed')}
                    >
                      Close
                    </button>
                  </div>

                  <div className="response-section">
                    <label htmlFor="responseText">Admin Response (Optional):</label>
                    <textarea
                      id="responseText"
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Enter your response to the user..."
                      rows="4"
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={() => updateComplaintStatus(selectedComplaint._id, selectedComplaint.status, responseText)}
                    >
                      Send Response
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
