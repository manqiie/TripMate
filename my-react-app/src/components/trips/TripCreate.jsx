// src/components/trips/TripCreate.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import TripService from '../../services/trip.service';
import { FaSave, FaTimes, FaPlus, FaCalendarAlt, FaLock, FaEye, FaShare } from 'react-icons/fa';

const TripCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'planning',
    privacy: 'private'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate dates
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await TripService.createTrip(formData);
      navigate(`/trips/${response.data.id}`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          Object.values(error.response?.data || {}).flat().join(' ') ||
                          'Failed to create trip';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">
                <FaPlus className="me-2" />
                Create New Trip
              </h2>
            </div>
            
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="title" className="form-label">
                    Trip Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter a memorable title for your trip"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe your trip, what you plan to do, places you want to visit..."
                  ></textarea>
                </div>
                
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label htmlFor="start_date" className="form-label">
                      <FaCalendarAlt className="me-2" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="end_date" className="form-label">
                      <FaCalendarAlt className="me-2" />
                      End Date
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="end_date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      min={formData.start_date}
                    />
                  </div>
                </div>
                
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label htmlFor="status" className="form-label">
                      Trip Status
                    </label>
                    <select
                      className="form-select"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="planning">Planning</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="privacy" className="form-label">
                      Privacy Setting
                    </label>
                    <select
                      className="form-select"
                      id="privacy"
                      name="privacy"
                      value={formData.privacy}
                      onChange={handleChange}
                    >
                      <option value="private">
                        <FaLock /> Private (Only you can see)
                      </option>
                      <option value="shared">
                        <FaShare /> Shared (Anyone with link can see)
                      </option>
                      <option value="public">
                        <FaEye /> Public (Visible to everyone)
                      </option>
                    </select>
                    <div className="form-text">
                      {formData.privacy === 'private' && 'Only you can view and edit this trip'}
                      {formData.privacy === 'shared' && 'Anyone with the share link can view this trip'}
                      {formData.privacy === 'public' && 'This trip will be visible to all users'}
                    </div>
                  </div>
                </div>
                
                <div className="alert alert-info">
                  <h6 className="alert-heading">What's Next?</h6>
                  <p className="mb-0">
                    After creating your trip, you'll be able to:
                  </p>
                  <ul className="mt-2 mb-0">
                    <li>Add destinations and places to visit</li>
                    <li>Optimize your route using Google Maps</li>
                    <li>Upload photos and videos</li>
                    <li>Create detailed itineraries</li>
                    <li>Share your trip with friends and family</li>
                  </ul>
                </div>
                
                <div className="d-flex justify-content-between">
                  <Link to="/trips" className="btn btn-outline-secondary">
                    <FaTimes className="me-2" />
                    Cancel
                  </Link>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating Trip...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        Create Trip
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripCreate;