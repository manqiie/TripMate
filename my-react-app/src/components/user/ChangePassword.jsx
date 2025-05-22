// src/components/user/ChangePassword.jsx 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserService from '../../services/user.service';
import { FaKey, FaArrowLeft, FaCheck } from 'react-icons/fa';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password2: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const { old_password, new_password, new_password2 } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = e => {
    e.preventDefault();
    
    if (new_password !== new_password2) {
      setMessage('New passwords do not match');
      setIsSuccess(false);
      return;
    }
    
    setLoading(true);
    setMessage('');

    UserService.changePassword(old_password, new_password)
      .then(response => {
        setIsSuccess(true);
        setMessage('Password changed successfully!');
        setShowSuccess(true);
        setFormData({
          old_password: '',
          new_password: '',
          new_password2: ''
        });
        setLoading(false);
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate('/profile', { replace: true });
        }, 3000);
      })
      .catch(error => {
        const resMessage = (error.response && 
          error.response.data && 
          Object.values(error.response.data).flat().join(' ')) || 
          error.message || 
          error.toString();
        
        setMessage(resMessage);
        setIsSuccess(false);
        setLoading(false);
      });
  };

  const handleGoToProfile = () => {
    navigate('/profile', { replace: true });
  };

  if (showSuccess) {
    return (
      <div className="card">
        <div className="card-body text-center p-5">
          <div className="mb-4">
            <div className="bg-success text-white rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{width: "80px", height: "80px"}}>
              <FaCheck size={40} />
            </div>
          </div>
          <h3 className="text-success mb-3">Password Changed Successfully!</h3>
          <p className="text-muted mb-4">Your password has been updated. You can continue using your account with the new password.</p>
          <div className="d-grid gap-2 col-md-6 mx-auto">
            <button 
              onClick={handleGoToProfile}
              className="btn btn-primary btn-lg"
            >
              Back to Profile
            </button>
          </div>
          <p className="text-muted mt-3 small">
            You will be automatically redirected in a few seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h2 className="mb-0 d-flex align-items-center">
          <FaKey className="me-2" />
          Change Password
        </h2>
      </div>
      <div className="card-body p-4">
        {message && (
          <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'} d-flex align-items-center`} role="alert">
            {isSuccess && <FaCheck className="me-2" />}
            {message}
          </div>
        )}
        
        <p className="text-muted mb-4">
          For your security, please enter your current password to confirm your identity before setting a new password.
        </p>
        
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label htmlFor="old_password" className="form-label">
              <FaKey className="me-2" />Current Password
            </label>
            <input
              type="password"
              className="form-control form-control-lg"
              id="old_password"
              name="old_password"
              value={old_password}
              onChange={onChange}
              placeholder="Enter your current password"
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="new_password" className="form-label">
              <FaKey className="me-2" />New Password
            </label>
            <input
              type="password"
              className="form-control form-control-lg"
              id="new_password"
              name="new_password"
              value={new_password}
              onChange={onChange}
              placeholder="Enter your new password"
              minLength="6"
              required
            />
            <div className="form-text">Password must be at least 6 characters long.</div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="new_password2" className="form-label">
              <FaKey className="me-2" />Confirm New Password
            </label>
            <input
              type="password"
              className="form-control form-control-lg"
              id="new_password2"
              name="new_password2"
              value={new_password2}
              onChange={onChange}
              placeholder="Confirm your new password"
              minLength="6"
              required
            />
          </div>
          
          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center"
              onClick={handleGoToProfile}
            >
              <FaArrowLeft className="me-2" />
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary d-flex align-items-center" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Changing Password...
                </>
              ) : (
                <>
                  <FaKey className="me-2" />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;