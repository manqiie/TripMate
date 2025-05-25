// src/components/layout/Navbar.jsx - Updated with trips navigation
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaPlane, FaUserCircle, FaSignInAlt, FaUserPlus, FaHome, FaTachometerAlt, FaEnvelope, FaSignOutAlt, FaMapMarkedAlt } from 'react-icons/fa';

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

  const isPathActive = (basePath) => {
    return location.pathname.startsWith(basePath) ? 'active' : '';
  };

  // Get user initials for fallback
  const getUserInitials = () => {
    if (currentUser?.first_name || currentUser?.last_name) {
      const first = currentUser.first_name ? currentUser.first_name[0] : '';
      const last = currentUser.last_name ? currentUser.last_name[0] : '';
      return (first + last).toUpperCase();
    }
    return currentUser?.username ? currentUser.username[0].toUpperCase() : '?';
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
            
            {currentUser && (
              <li className="nav-item">
                <Link 
                  className={`nav-link ${isPathActive('/trips')}`} 
                  to="/trips"
                  onClick={closeMenu}
                >
                  <FaMapMarkedAlt className="me-2" />
                  My Trips
                </Link>
              </li>
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
                      className={`nav-link ${isPathActive('/admin')}`} 
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
                {/* Profile Picture/Avatar - Moved to the far right */}
                <li className="nav-item ms-lg-3 mt-2 mt-lg-0">
                  <Link to="/profile" onClick={closeMenu} className="d-flex align-items-center text-decoration-none">
                    {currentUser.profile && currentUser.profile.profile_picture ? (
                      <img 
                        src={currentUser.profile.profile_picture} 
                        alt="Profile" 
                        className="rounded-circle border border-2 border-light"
                        width="36"
                        height="36"
                        style={{ 
                          objectFit: "cover",
                          cursor: "pointer",
                          transition: "transform 0.2s ease"
                        }}
                        onMouseOver={(e) => e.target.style.transform = "scale(1.1)"}
                        onMouseOut={(e) => e.target.style.transform = "scale(1)"}
                      />
                    ) : (
                      <div 
                        className="rounded-circle bg-light d-flex align-items-center justify-content-center border border-2 border-light" 
                        style={{ 
                          width: "36px", 
                          height: "36px", 
                          color: "#4066E0",
                          fontWeight: "600",
                          fontSize: "14px",
                          cursor: "pointer",
                          transition: "transform 0.2s ease"
                        }}
                        onMouseOver={(e) => e.target.style.transform = "scale(1.1)"}
                        onMouseOut={(e) => e.target.style.transform = "scale(1)"}
                      >
                        {getUserInitials()}
                      </div>
                    )}
                  </Link>
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
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;