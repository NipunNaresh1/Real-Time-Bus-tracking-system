import React, { useState } from 'react';

const BusSearch = ({ onSearch, searchQuery, onSearchInputChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    const field = name === 'startLocation' ? 'from' : 'to';
    onSearchInputChange(field, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Search Buses</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-group">
          <label htmlFor="startLocation" className="form-label">From</label>
          <input
            type="text"
            id="startLocation"
            name="startLocation"
            value={searchQuery?.from || ''}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter start location"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endLocation" className="form-label">To</label>
          <input
            type="text"
            id="endLocation"
            name="endLocation"
            value={searchQuery?.to || ''}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter destination"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary search-btn">
          Search Buses
        </button>
      </form>
    </div>
  );
};

export default BusSearch;
