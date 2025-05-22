// src/components/user/Profile.jsx - Fixed profile picture sizing
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserService from '../../services/user.service';
import { FaEdit, FaKey, FaMapMarkedAlt, FaPhone, FaPlaneDeparture, FaSuitcase, FaEnvelope, FaUser, FaMapMarkerAlt } from 'react-icons/fa';

const Profile = ({ currentUser }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trips, setTrips] = useState([
    { id: 1, title: "Weekend in Paris", date: "Jun 15-18", status: "Upcoming" },
    { id: 2, title: "Tokyo Adventure", date: "Aug 5-15", status: "Planning" },
    { id: 3, title: "Barcelona Trip", date: "Mar 10-17", status: "Completed" }
  ]);

  useEffect(() => {
    UserService.getUserProfile()
      .then(response => {
        setProfile(response.data);
        setLoading(false);
      })
      .catch(error => {
        const resMessage = (error.response && 
          error.response.data && 
          Object.values(error.response.data).flat().join(' ')) || 
          error.message || 
          error.toString();
        
        setError(resMessage);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  // Get status color for trip badges
  const getStatusColor = (status) => {
    switch(status) {
      case 'Upcoming':
        return 'bg-warning';
      case 'Planning':
        return 'bg-primary';
      case 'Completed':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div className="row">
      <div className="col-lg-4 mb-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="profile-header">
              {profile.profile && profile.profile.profile_picture ? (
                <div 
                  className="mx-auto mb-3 border border-3 border-light shadow-sm"
                  style={{
                    width: "350px",
                    height: "350px",
                    backgroundImage: `url(${profile.profile.profile_picture})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                  }}
                />
              ) : (
                <div 
                  className="mx-auto mb-3 rounded-circle bg-secondary d-flex align-items-center justify-content-center border border-3 border-light shadow-sm"
                  style={{ 
                    width: "150px", 
                    height: "150px" 
                  }}
                >
                  <span className="text-white" style={{ fontSize: "3rem", fontWeight: "600" }}>
                    {profile.first_name && profile.first_name[0]}
                    {profile.last_name && profile.last_name[0]}
                  </span>
                </div>
              )}
              <h3 className="mb-0">{profile.first_name} {profile.last_name}</h3>
              <p className="text-muted">@{profile.username}</p>
            </div>
            
            <div className="d-grid gap-2">
              <Link to="/edit-profile" className="btn btn-primary d-flex align-items-center justify-content-center">
                <FaEdit className="me-2" /> Edit Profile
              </Link>
              <Link to="/change-password" className="btn btn-outline-secondary d-flex align-items-center justify-content-center">
                <FaKey className="me-2" /> Change Password
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="card mb-4">
          <div className="card-header">
            <h2>Profile Info</h2>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <p className="text-muted mb-1">
                  <FaUser className="me-2" />Full Name
                </p>
                <p className="fs-5">{profile.first_name} {profile.last_name}</p>
              </div>
              <div className="col-md-6 mb-3">
                <p className="text-muted mb-1">
                  <FaUser className="me-2" />Username
                </p>
                <p className="fs-5">{profile.username}</p>
              </div>
              <div className="col-md-6 mb-3">
                <p className="text-muted mb-1">
                  <FaEnvelope className="me-2" />Email
                </p>
                <p className="fs-5">{profile.email}</p>
              </div>
              
              {profile.profile && (
                <>
                  {profile.profile.phone_number && (
                    <div className="col-md-6 mb-3">
                      <p className="text-muted mb-1">
                        <FaPhone className="me-2" />Phone
                      </p>
                      <p className="fs-5">{profile.profile.phone_number}</p>
                    </div>
                  )}
                  
                  {profile.profile.location && (
                    <div className="col-md-6 mb-3">
                      <p className="text-muted mb-1">
                        <FaMapMarkerAlt className="me-2" />Location
                      </p>
                      <p className="fs-5">{profile.profile.location}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {profile.profile && profile.profile.bio && (
              <div className="mt-3">
                <p className="text-muted mb-2">About Me</p>
                <div className="profile-bio">
                  <p className="mb-0">{profile.profile.bio}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Trip Section - This would connect to your trips data in a real app */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h2>My Trips</h2>
            <Link to="/trips/new" className="btn btn-primary d-flex align-items-center">
              <FaPlaneDeparture className="me-2" /> New Trip
            </Link>
          </div>
          <div className="card-body">
            {trips.length > 0 ? (
              <div className="list-group">
                {trips.map(trip => (
                  <Link 
                    key={trip.id} 
                    to={`/trips/${trip.id}`} 
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div className="d-flex align-items-center">
                        <FaSuitcase className="me-3 text-primary" />
                        <div>
                          <h5 className="mb-1">{trip.title}</h5>
                          <p className="text-muted small mb-0">{trip.date}</p>
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <FaMapMarkedAlt size={48} className="text-muted mb-3" />
                <h4>No trips yet</h4>
                <p className="text-muted">Start planning your first adventure!</p>
                <Link to="/trips/new" className="btn btn-primary mt-2">
                  Create a Trip
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;