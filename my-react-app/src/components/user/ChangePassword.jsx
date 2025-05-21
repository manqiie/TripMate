// src/components/user/ChangePassword.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserService from '../../services/user.service';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password2: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const { old_password, new_password, new_password2 } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = e => {
    e.preventDefault();
    
    if (new_password !== new_password2) {
      setMessage('New passwords do not match');
      return;
    }
    
    setLoading(true);
    setMessage('');

    UserService.changePassword(old_password, new_password)
      .then(response => {
        setIsSuccess(true);
        setMessage('Password changed successfully!');
        setFormData({
          old_password: '',
          new_password: '',
          new_password2: ''
        });
        
        // Navigate back to profile after a short delay
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      })
      .catch(error => {
        const resMessage = (error.response && 
          error.response.data && 
          Object.values(error.response.data).flat().join(' ')) || 
          error.message || 
          error.toString();
        
        setMessage(resMessage);
        setLoading(false);
      });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Change Password</h2>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'}`} role="alert">
            {message}
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label htmlFor="old_password" className="form-label">Current Password</label>
            <input
              type="password"
              className="form-control"
              id="old_password"
              name="old_password"
              value={old_password}
              onChange={onChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="new_password" className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              id="new_password"
              name="new_password"
              value={new_password}
              onChange={onChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="new_password2" className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              id="new_password2"
              name="new_password2"
              value={new_password2}
              onChange={onChange}
              required
            />
          </div>
          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-secondary me-2"
              onClick={() => navigate('/profile')}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
