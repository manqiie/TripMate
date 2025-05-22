// src/components/auth/ResetPassword.jsx - Fixed to prevent blank pages
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { FaEnvelope, FaKey, FaArrowLeft, FaCheck } from 'react-icons/fa';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = email input, 2 = token verification, 3 = success
  const navigate = useNavigate();

  const handleRequestToken = e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    apiClient.post('accounts/password-reset-request/', { email })
      .then(response => {
        setIsSuccess(true);
        setMessage('A verification code has been sent to your email. Please check your inbox and enter the code below.');
        setStep(2);
        setLoading(false);
      })
      .catch(error => {
        if (error.response && error.response.data) {
          setMessage(Object.values(error.response.data).flat().join(' '));
        } else {
          setMessage('An error occurred. Please try again.');
        }
        setIsSuccess(false);
        setLoading(false);
      });
  };

  const handleVerifyToken = e => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      setIsSuccess(false);
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    apiClient.post('accounts/password-reset-verify/', { 
      email, 
      token, 
      new_password: newPassword 
    })
      .then(response => {
        setIsSuccess(true);
        setMessage('Your password has been reset successfully!');
        setStep(3);
        setLoading(false);
        
        // Auto redirect after 3 seconds, but don't force it
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      })
      .catch(error => {
        if (error.response && error.response.data) {
          setMessage(Object.values(error.response.data).flat().join(' '));
        } else {
          setMessage('An error occurred. Please try again.');
        }
        setIsSuccess(false);
        setLoading(false);
      });
  };

  const handleGoToLogin = () => {
    navigate('/login', { replace: true });
  };

  const renderStepOne = () => (
    <form onSubmit={handleRequestToken}>
      <div className="mb-4">
        <label htmlFor="email" className="form-label">
          <FaEnvelope className="me-2" />Email Address
        </label>
        <input
          type="email"
          className="form-control form-control-lg"
          id="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your registered email"
          required
        />
      </div>
      
      <div className="d-grid mb-3">
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Sending...
            </>
          ) : (
            'Send Verification Code'
          )}
        </button>
      </div>
    </form>
  );

  const renderStepTwo = () => (
    <form onSubmit={handleVerifyToken}>
      <div className="mb-3">
        <label htmlFor="token" className="form-label">
          <FaKey className="me-2" />Verification Code
        </label>
        <input
          type="text"
          className="form-control form-control-lg"
          id="token"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Enter 6-digit code"
          maxLength="6"
          required
        />
      </div>
      
      <div className="mb-3">
        <label htmlFor="newPassword" className="form-label">
          <FaKey className="me-2" />New Password
        </label>
        <input
          type="password"
          className="form-control form-control-lg"
          id="newPassword"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          required
          minLength="6"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="confirmPassword" className="form-label">
          <FaKey className="me-2" />Confirm Password
        </label>
        <input
          type="password"
          className="form-control form-control-lg"
          id="confirmPassword"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
          minLength="6"
        />
      </div>
      
      <div className="d-grid mb-3">
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </div>
      
      <div className="d-grid">
        <button 
          type="button" 
          className="btn btn-outline-secondary"
          onClick={() => {
            setStep(1);
            setMessage('');
            setToken('');
            setNewPassword('');
            setConfirmPassword('');
          }}
        >
          Back to Email Step
        </button>
      </div>
    </form>
  );

  const renderStepThree = () => (
    <div className="text-center">
      <div className="mb-4">
        <div className="bg-success text-white rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{width: "80px", height: "80px"}}>
          <FaCheck size={40} />
        </div>
      </div>
      <h4 className="text-success mb-3">Password Reset Complete!</h4>
      <p className="mb-4">Your password has been reset successfully. You can now login with your new password.</p>
      <div className="d-grid gap-2">
        <button 
          onClick={handleGoToLogin}
          className="btn btn-primary btn-lg"
        >
          Go to Login Now
        </button>
        <Link to="/" className="btn btn-outline-secondary">
          Back to Home
        </Link>
      </div>
      <p className="text-muted mt-3 small">
        You will be automatically redirected to login in a few seconds...
      </p>
    </div>
  );

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white text-center py-3">
            <h2 className="mb-0">
              {step === 1 && 'Reset Password'}
              {step === 2 && 'Verify Code & Set New Password'}
              {step === 3 && 'Success!'}
            </h2>
          </div>
          <div className="card-body p-4">
            {message && (
              <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'}`} role="alert">
                {message}
              </div>
            )}
            
            {step === 1 && (
              <p className="text-center text-muted mb-4">
                Enter the email address associated with your account, and we'll send you a verification code to reset your password.
              </p>
            )}
            
            {step === 2 && (
              <p className="text-center text-muted mb-4">
                Check your email for the verification code and create your new password below.
              </p>
            )}
            
            {step === 1 && renderStepOne()}
            {step === 2 && renderStepTwo()}
            {step === 3 && renderStepThree()}
            
            {step !== 3 && (
              <div className="text-center mt-3">
                <Link to="/login" className="text-decoration-none">
                  <FaArrowLeft className="me-1" /> Back to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;