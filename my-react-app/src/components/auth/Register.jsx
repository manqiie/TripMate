// src/components/auth/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { FaUserPlus, FaUser, FaEnvelope, FaLock, FaIdCard, FaSignInAlt } from 'react-icons/fa';

const Register = ({ setCurrentUser }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const { username, email, password, password2, first_name, last_name } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = e => {
    e.preventDefault();
    
    if (password !== password2) {
      setMessage('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setMessage('');

    AuthService.register(username, email, password, first_name, last_name)
      .then(response => {
        // Log the user in after successful registration
        return AuthService.login(username, password);
      })
      .then(data => {
        setCurrentUser(data);
        navigate('/profile');
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
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white text-center py-3">
            <h2 className="mb-0 d-flex align-items-center justify-content-center">
              <FaUserPlus className="me-2" /> Create Account
            </h2>
          </div>
          <div className="card-body p-4">
            {message && (
              <div className="alert alert-danger" role="alert">
                {message}
              </div>
            )}
            
            <p className="text-center text-muted mb-4">
              Join TripMate today and start planning your dream vacations!
            </p>
            
            <form onSubmit={onSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="first_name" className="form-label">
                    <FaIdCard className="me-2" />First Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="first_name"
                    name="first_name"
                    value={first_name}
                    onChange={onChange}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="last_name" className="form-label">
                    <FaIdCard className="me-2" />Last Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="last_name"
                    name="last_name"
                    value={last_name}
                    onChange={onChange}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="username" className="form-label">
                  <FaUser className="me-2" />Username
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  name="username"
                  value={username}
                  onChange={onChange}
                  placeholder="Choose a username"
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  <FaEnvelope className="me-2" />Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  <FaLock className="me-2" />Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  placeholder="Create a password"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="password2" className="form-label">
                  <FaLock className="me-2" />Confirm Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password2"
                  name="password2"
                  value={password2}
                  onChange={onChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              
              <div className="d-grid">
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Account...
                    </>
                  ) : (
                    <>Register</>
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-4 text-center">
              <p className="mb-0">
                Already have an account?{' '}
                <Link to="/login" className="text-decoration-none fw-semibold">
                  <FaSignInAlt className="me-1" />Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;