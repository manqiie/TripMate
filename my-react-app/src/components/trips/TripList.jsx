// src/components/trips/TripList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TripService from '../../services/trip.service';
import { 
  FaPlus, FaMapMarkedAlt, FaCalendarAlt, FaImage, FaSearch, 
  FaFilter, FaSuitcase, FaEye, FaEdit, FaTrash, FaCopy, FaShare 
} from 'react-icons/fa';

const TripList = () => {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    filterTrips();
  }, [trips, searchTerm, statusFilter]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await TripService.getTrips();
      setTrips(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch trips');
      setLoading(false);
    }
  };

  const filterTrips = () => {
    let filtered = trips;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(trip =>
        trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }

    setFilteredTrips(filtered);
  };

  const handleDeleteTrip = async (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await TripService.deleteTrip(tripId);
        setMessage('Trip deleted successfully');
        fetchTrips();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setError('Failed to delete trip');
      }
    }
  };

  const handleDuplicateTrip = async (tripId) => {
    try {
      await TripService.duplicateTrip(tripId);
      setMessage('Trip duplicated successfully');
      fetchTrips();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError('Failed to duplicate trip');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'planning': 'bg-primary',
      'upcoming': 'bg-warning',
      'ongoing': 'bg-info',
      'completed': 'bg-success',
      'cancelled': 'bg-secondary'
    };
    return colors[status] || 'bg-secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'planning': <FaEdit />,
      'upcoming': <FaCalendarAlt />,
      'ongoing': <FaSuitcase />,
      'completed': <FaMapMarkedAlt />,
      'cancelled': <FaTrash />
    };
    return icons[status] || <FaSuitcase />;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading trips...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Trips</h1>
        <Link to="/trips/new" className="btn btn-primary">
          <FaPlus className="me-2" />
          New Trip
        </Link>
      </div>

      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search trips by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <FaFilter />
                </span>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="planning">Planning</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Grid */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-5">
          <FaMapMarkedAlt size={64} className="text-muted mb-3" />
          <h3>No trips found</h3>
          <p className="text-muted">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Start planning your first adventure!'
            }
          </p>
          <Link to="/trips/new" className="btn btn-primary">
            <FaPlus className="me-2" />
            Create Your First Trip
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {filteredTrips.map((trip) => (
            <div key={trip.id} className="col-lg-4 col-md-6">
              <div className="card h-100 trip-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">{trip.title}</h5>
                  <span className={`badge ${getStatusColor(trip.status)} d-flex align-items-center`}>
                    {getStatusIcon(trip.status)}
                    <span className="ms-1">{trip.status}</span>
                  </span>
                </div>
                
                <div className="card-body">
                  {trip.description && (
                    <p className="card-text text-muted mb-3">
                      {trip.description.length > 100 
                        ? `${trip.description.substring(0, 100)}...`
                        : trip.description
                      }
                    </p>
                  )}
                  
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="d-flex align-items-center">
                        <FaMapMarkedAlt className="text-primary me-2" />
                        <small>{trip.destinations_count} destinations</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex align-items-center">
                        <FaImage className="text-primary me-2" />
                        <small>{trip.media_count} photos</small>
                      </div>
                    </div>
                  </div>
                  
                  {trip.start_date && (
                    <div className="mb-3">
                      <div className="d-flex align-items-center">
                        <FaCalendarAlt className="text-primary me-2" />
                        <small>
                          {new Date(trip.start_date).toLocaleDateString()}
                          {trip.end_date && trip.end_date !== trip.start_date && (
                            <> - {new Date(trip.end_date).toLocaleDateString()}</>
                          )}
                        </small>
                      </div>
                    </div>
                  )}
                  
                  {trip.total_distance && (
                    <div className="mb-3">
                      <small className="text-muted">
                        Distance: {trip.total_distance.toFixed(1)} km
                        {trip.total_duration && (
                          <> • Duration: {Math.round(trip.total_duration / 60)}h {trip.total_duration % 60}m</>
                        )}
                      </small>
                    </div>
                  )}
                </div>
                
                <div className="card-footer">
                  <div className="d-flex justify-content-between">
                    <div className="btn-group" role="group">
                      <Link 
                        to={`/trips/${trip.id}`}
                        className="btn btn-sm btn-outline-primary"
                        title="View Trip"
                      >
                        <FaEye />
                      </Link>
                      <Link 
                        to={`/trips/${trip.id}/edit`}
                        className="btn btn-sm btn-outline-secondary"
                        title="Edit Trip"
                      >
                        <FaEdit />
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-info"
                        onClick={() => handleDuplicateTrip(trip.id)}
                        title="Duplicate Trip"
                      >
                        <FaCopy />
                      </button>
                    </div>
                    
                    <div className="btn-group" role="group">
                      {trip.privacy !== 'private' && (
                        <button
                          className="btn btn-sm btn-outline-success"
                          title="Share Trip"
                          onClick={() => navigator.clipboard.writeText(trip.share_url)}
                        >
                          <FaShare />
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteTrip(trip.id)}
                        title="Delete Trip"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripList;