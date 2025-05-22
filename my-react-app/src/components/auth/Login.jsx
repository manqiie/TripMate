// src/components/auth/Login.jsx - Updated to accept email or username
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { FaSignInAlt, FaUser, FaLock, FaUserPlus } from 'react-icons/fa';

const Login = ({ setCurrentUser }) => {
  const [formData, setFormData] = useState({
    username_or_email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const { username_or_email, password } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    AuthService.login(username_or_email, password)
      .then(data => {
        setCurrentUser(data);
        navigate('/profile');
      })
      .catch(error => {
        console.error('Login error:', error);
        const resMessage = (error.response && 
          error.response.data && 
          (error.response.data.non_field_errors || 
           Object.values(error.response.data).flat().join(' '))) || 
          error.message || 
          error.toString();
        
        setMessage(resMessage);
        setLoading(false);
      });
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white text-center py-3">
            <h2 className="mb-0 d-flex align-items-center justify-content-center">
              <FaSignInAlt className="me-2" /> Login
            </h2>
          </div>
          <div className="card-body p-4">
            {message && (
              <div className="alert alert-danger" role="alert">
                {message}
              </div>
            )}
            
            <p className="text-center text-muted mb-4">
              Welcome back! Please enter your credentials to access your account.
            </p>
            
            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label htmlFor="username_or_email" className="form-label">
                  <FaUser className="me-2" />Username or Email
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="username_or_email"
                  name="username_or_email"
                  value={username_or_email}
                  onChange={onChange}
                  placeholder="Enter your username or email"
                  required
                />
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between">
                  <label htmlFor="password" className="form-label">
                    <FaLock className="me-2" />Password
                  </label>
                  <Link to="/reset-password" className="text-decoration-none small">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  className="form-control form-control-lg"
                  id="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="d-grid">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-4 text-center">
              <p className="mb-0">
                Don't have an account?{' '}
                <Link to="/register" className="text-decoration-none fw-semibold">
                  <FaUserPlus className="me-1" />Register now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;