// src/components/admin/AdminUserEdit.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import UserService from '../../services/user.service';

const AdminUserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchUserData = () => {
    setLoading(true);
    UserService.getUserById(id)
      .then(response => {
        setUserData(response.data);
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
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setUserData(prevState => ({
        ...prevState,
        profile: {
          ...prevState.profile,
          [profileField]: value
        }
      }));
    } else {
      setUserData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = e => {
    const { name, checked } = e.target;
    setUserData(prevState => ({
      ...prevState,
      [name]: checked
    }));
  };

  const handleResetPassword = e => {
    e.preventDefault();
    
    if (!newPassword) {
      setMessage('Please enter a new password');
      setIsSuccess(false);
      return;
    }
    
    UserService.resetUserPassword(id, newPassword)
      .then(response => {
        setIsSuccess(true);
        setMessage('Password has been reset successfully.');
        setNewPassword('');
        setResetPasswordMode(false);
      })
      .catch(error => {
        const resMessage = (error.response && 
          error.response.data && 
          Object.values(error.response.data).flat().join(' ')) || 
          error.message || 
          error.toString();
        
        setMessage(resMessage);
        setIsSuccess(false);
      });
  };

  const handleSubmit = e => {
    e.preventDefault();
    
    UserService.updateUser(id, userData)
      .then(response => {
        setIsSuccess(true);
        setMessage('User information has been updated successfully.');
        
        // Refresh user data
        fetchUserData();
      })
      .catch(error => {
        const resMessage = (error.response && 
          error.response.data && 
          Object.values(error.response.data).flat().join(' ')) || 
          error.message || 
          error.toString();
        
        setMessage(resMessage);
        setIsSuccess(false);
      });
  };

  if (loading) {
    return <div>Loading user data...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h2>Edit User: {userData.username}</h2>
        <Link to="/admin/users" className="btn btn-secondary">Back to Users</Link>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'}`} role="alert">
            {message}
          </div>
        )}
        
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${!resetPasswordMode ? 'active' : ''}`}
              onClick={() => setResetPasswordMode(false)}
            >
              User Details
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${resetPasswordMode ? 'active' : ''}`}
              onClick={() => setResetPasswordMode(true)}
            >
              Reset Password
            </button>
          </li>
        </ul>

        {!resetPasswordMode ? (
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="first_name" className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="first_name"
                  name="first_name"
                  value={userData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="last_name" className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="last_name"
                  name="last_name"
                  value={userData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                id="username"
                name="username"
                value={userData.username}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="is_active"
                name="is_active"
                checked={userData.is_active}
                onChange={handleCheckboxChange}
              />
              <label className="form-check-label" htmlFor="is_active">Active</label>
            </div>
            
            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="is_staff"
                name="is_staff"
                checked={userData.is_staff}
                onChange={handleCheckboxChange}
              />
              <label className="form-check-label" htmlFor="is_staff">Admin Access</label>
            </div>
            
            <h4 className="mt-4">Profile Information</h4>
            
            {userData.profile && (
              <>
                <div className="mb-3">
                  <label htmlFor="profile.bio" className="form-label">Bio</label>
                  <textarea
                    className="form-control"
                    id="profile.bio"
                    name="profile.bio"
                    rows="3"
                    value={userData.profile.bio || ''}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="profile.location" className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      id="profile.location"
                      name="profile.location"
                      value={userData.profile.location || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="profile.phone_number" className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      id="profile.phone_number"
                      name="profile.phone_number"
                      value={userData.profile.phone_number || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="d-flex justify-content-end">
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="mb-3">
              <label htmlFor="new_password" className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                id="new_password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="d-flex justify-content-end">
              <button type="submit" className="btn btn-warning">
                Reset Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default AdminUserEdit;