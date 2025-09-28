import React, { useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getApiBase } from '../config';
import './ComplaintForm.css';

const ComplaintForm = ({ onClose, onSubmit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'bus_service',
    priority: 'medium',
    busId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const categories = [
    { value: 'bus_service', label: 'Bus Service' },
    { value: 'driver_behavior', label: 'Driver Behavior' },
    { value: 'cleanliness', label: 'Cleanliness' },
    { value: 'safety', label: 'Safety Concern' },
    { value: 'technical_issue', label: 'Technical Issue' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    
    switch (name) {
      case 'subject':
        if (!value.trim()) {
          errors.subject = 'Subject is required';
        } else if (value.length < 5) {
          errors.subject = 'Subject must be at least 5 characters';
        } else {
          delete errors.subject;
        }
        break;
      case 'description':
        if (!value.trim()) {
          errors.description = 'Description is required';
        } else if (value.length < 10) {
          errors.description = 'Description must be at least 10 characters';
        } else {
          delete errors.description;
        }
        break;
      default:
        break;
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear errors when user starts typing
    if (fieldErrors[name]) {
      validateField(name, value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const isSubjectValid = validateField('subject', formData.subject);
    const isDescriptionValid = validateField('description', formData.description);
    
    if (!isSubjectValid || !isDescriptionValid) {
      setError('Please fix the errors above before submitting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBase()}/api/complaint/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onSubmit) onSubmit(data.complaint);
          if (onClose) onClose();
        }, 2000);
      } else {
        setError(data.message || 'Failed to submit complaint');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complaint-form-overlay">
      <div className="complaint-form-container">
        <div className="complaint-form-header">
          <h2>Submit a Complaint</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h3>Complaint Submitted Successfully!</h3>
            <p>Thank you for your feedback. We'll review your complaint and get back to you soon.</p>
            <div className="success-animation">
              <div className="checkmark">
                <div className="checkmark-circle"></div>
                <div className="checkmark-stem"></div>
                <div className="checkmark-kick"></div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="complaint-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                maxLength="200"
                placeholder="Brief description of the issue"
                className={fieldErrors.subject ? 'error' : ''}
              />
              {fieldErrors.subject && <div className="field-error">{fieldErrors.subject}</div>}
            </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="busId">Bus Number (Optional)</label>
            <input
              type="text"
              id="busId"
              name="busId"
              value={formData.busId}
              onChange={handleChange}
              placeholder="Enter bus number if complaint is bus-specific"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              maxLength="1000"
              rows="5"
              placeholder="Provide detailed information about your complaint"
              className={fieldErrors.description ? 'error' : ''}
            />
            {fieldErrors.description && <div className="field-error">{fieldErrors.description}</div>}
            <small className={formData.description.length > 900 ? 'char-warning' : ''}>
              {formData.description.length}/1000 characters
            </small>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Submitting...
                </>
              ) : (
                'Submit Complaint'
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default ComplaintForm;
