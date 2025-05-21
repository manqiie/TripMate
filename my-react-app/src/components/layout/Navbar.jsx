// src/components/layout/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaPlane, FaUserCircle, FaSignInAlt, FaUserPlus, FaHome, FaTachometerAlt, FaEnvelope, FaSignOutAlt } from 'react-icons/fa';

const Navbar = ({ currentUser, logOut }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark">
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={closeMenu}>
          <FaPlane className="me-2" />
          TripMate
        </Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          onClick={toggleMenu}
          aria-expanded={isMenuOpen ? "true" : "false"}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/')}`} 
                to="/" 
                onClick={closeMenu}
              >
                <FaHome className="me-2" />
                Home
              </Link>
            </li>
            
            {currentUser ? (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/profile')}`} 
                    to="/profile"
                    onClick={closeMenu}
                  >
                    <FaUserCircle className="me-2" />
                    Profile
                  </Link>
                </li>
                {currentUser.is_staff && (
                  <li className="nav-item">
                    <Link 
                      className={`nav-link ${isActive('/admin')}`} 
                      to="/admin"
                      onClick={closeMenu}
                    >
                      <FaTachometerAlt className="me-2" />
                      Admin
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link 
                    className="nav-link" 
                    to="/" 
                    onClick={() => {
                      logOut();
                      closeMenu();
                    }}
                  >
                    <FaSignOutAlt className="me-2" />
                    Logout
                  </Link>
                </li>
                <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                  <div className="d-flex align-items-center">
                    {currentUser.profile && currentUser.profile.profile_picture ? (
                      <img 
                        src={currentUser.profile.profile_picture} 
                        alt="Profile" 
                        className="rounded-circle"
                        width="32"
                        height="32"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" 
                           style={{ width: "32px", height: "32px", color: "#4066E0" }}>
                        {currentUser.first_name && currentUser.first_name[0]}
                      </div>
                    )}
                  </div>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/login')}`} 
                    to="/login"
                    onClick={closeMenu}
                  >
                    <FaSignInAlt className="me-2" />
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/register')}`} 
                    to="/register"
                    onClick={closeMenu}
                  >
                    <FaUserPlus className="me-2" />
                    Register
                  </Link>
                </li>
              </>
            )}
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/contact')}`} 
                to="/contact"
                onClick={closeMenu}
              >
                <FaEnvelope className="me-2" />
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;