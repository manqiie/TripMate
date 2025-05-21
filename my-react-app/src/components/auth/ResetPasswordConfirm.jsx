// src/components/auth/ResetPasswordConfirm.js
import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

const ResetPasswordConfirm = () => {
  const [formData, setFormData] = useState({
    new_password1: '',
    new_password2: ''
  });
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const { new_password1, new_password2 } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    
    if (new_password1 !== new_password2) {
      setMessage('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    apiClient.post(`accounts/reset/${uid}/${token}/`, {
      new_password1,
      new_password2
    })
      .then(response => {
        setIsSuccess(true);
        setMessage('Password has been reset successfully.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
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
        <h2>Set New Password</h2>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'}`} role="alert">
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="new_password1" className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              id="new_password1"
              name="new_password1"
              value={new_password1}
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
          <button type="submit" className="btn btn-primary" disabled={loading || isSuccess}>
            {loading ? 'Setting Password...' : 'Set New Password'}
          </button>
        </form>
        <div className="mt-3">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordConfirm;