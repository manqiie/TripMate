// src/components/user/Profile.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserService from '../../services/user.service';

const Profile = ({ currentUser }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>User Profile</h2>
      </div>
      <div className="card-body">
        {profile && (
          <div className="row">
            <div className="col-md-4 text-center mb-4">
              {profile.profile && profile.profile.profile_picture ? (
                <img 
                  src={profile.profile.profile_picture} 
                  alt="Profile" 
                  className="img-fluid rounded-circle mb-3"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
              ) : (
                <div 
                  className="rounded-circle bg-secondary d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: '150px', height: '150px' }}
                >
                  <span className="text-white fs-1">
                    {profile.first_name && profile.first_name[0]}
                    {profile.last_name && profile.last_name[0]}
                  </span>
                </div>
              )}
              <div className="mt-3">
                <Link to="/edit-profile" className="btn btn-primary me-2">Edit Profile</Link>
                <Link to="/change-password" className="btn btn-outline-secondary">Change Password</Link>
              </div>
            </div>
            <div className="col-md-8">
              <h3>{profile.first_name} {profile.last_name}</h3>
              <p><strong>Username:</strong> {profile.username}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              
              {profile.profile && (
                <>
                  {profile.profile.bio && (
                    <div className="mb-3">
                      <h4>Bio</h4>
                      <p>{profile.profile.bio}</p>
                    </div>
                  )}
                  
                  {profile.profile.location && (
                    <p><strong>Location:</strong> {profile.profile.location}</p>
                  )}
                  
                  {profile.profile.phone_number && (
                    <p><strong>Phone:</strong> {profile.profile.phone_number}</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;