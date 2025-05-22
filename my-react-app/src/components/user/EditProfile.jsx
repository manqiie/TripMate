// src/components/user/EditProfile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UserService from '../../services/user.service';
import { FaUser, FaEnvelope, FaMapMarkerAlt, FaPhone, FaFileAlt, FaSave, FaTimes, FaCamera } from 'react-icons/fa';

const EditProfile = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    profile: {
      bio: '',
      location: '',
      phone_number: '',
      profile_picture: null
    }
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  // Update the useEffect in EditProfile.jsx to properly handle the profile data
  useEffect(() => {
    UserService.getUserProfile()
      .then(response => {
        const userData = response.data;
        // If profile is null in response, initialize it as an empty object
        if (!userData.profile) {
          userData.profile = {
            bio: '',
            location: '',
            phone_number: '',
            profile_picture: null
          };
        }
        
        setFormData(userData);
        if (userData.profile && userData.profile.profile_picture) {
          setPreviewImage(userData.profile.profile_picture);
        }
        setLoading(false);
      })
      .catch(error => {
        setMessage('Error loading profile. Please try again.');
        setLoading(false);
      });
  }, []);

  const onChange = e => {
    const { name, value } = e.target;
    
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setFormData(prevState => ({
        ...prevState,
        profile: {
          ...prevState.profile,
          [profileField]: value
        }
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const handleImageChange = e => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
      
      // Update formData with the file
      setFormData(prevState => ({
        ...prevState,
        profile: {
          ...prevState.profile,
          profile_picture: file
        }
      }));
    }
  };

  // In EditProfile.jsx - update the onSubmit function
  const onSubmit = e => {
    e.preventDefault();
    setUpdating(true);
    setMessage('');
    
    // Create a FormData object for file upload
    const formDataToSend = new FormData();
    
    // Basic user data
    formDataToSend.append('first_name', formData.first_name || '');
    formDataToSend.append('last_name', formData.last_name || '');
    
    // Profile data - using the correct fields without the 'profile.' prefix
    // This is important - your backend might expect these fields directly
    formDataToSend.append('bio', formData.profile.bio || '');
    formDataToSend.append('location', formData.profile.location || '');
    formDataToSend.append('phone_number', formData.profile.phone_number || '');
    
    // Handle profile picture separately
    if (formData.profile.profile_picture && 
        typeof formData.profile.profile_picture !== 'string') {
      formDataToSend.append('profile_picture', formData.profile.profile_picture);
    }

    console.log('Sending form data:');
    for (let pair of formDataToSend.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    UserService.updateUserProfile(formDataToSend)
      .then(response => {
        console.log('Update successful:', response.data);
        setIsSuccess(true);
        setMessage('Profile updated successfully!');
        setUpdating(false);
        
        // Navigate back to profile after a short delay
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      })
      .catch(error => {
        console.error('Update error:', error.response?.data || error);
        const resMessage = (error.response && 
          error.response.data && 
          Object.values(error.response.data).flat().join(' ')) || 
          error.message || 
          error.toString();
        
        setMessage(resMessage);
        setUpdating(false);
      });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading profile data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-primary text-white">
        <h2 className="mb-0">Edit Profile</h2>
      </div>
      <div className="card-body p-4">
        {message && (
          <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'}`} role="alert">
            {message}
          </div>
        )}
        
        <form onSubmit={onSubmit}>
          <div className="row">
            <div className="col-md-4 text-center mb-4">
              <div className="position-relative mx-auto" style={{ width: "180px" }}>
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Profile Preview" 
                    className="img-fluid rounded-circle mb-3"
                    style={{ width: "180px", height: "180px", objectFit: "cover" }}
                  />
                ) : (
                  <div 
                    className="rounded-circle bg-secondary d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ width: "180px", height: "180px" }}
                  >
                    <span className="text-white fs-1">
                      {formData.first_name && formData.first_name[0]}
                      {formData.last_name && formData.last_name[0]}
                    </span>
                  </div>
                )}
                
                <div 
                  className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 shadow"
                  style={{ cursor: "pointer" }}
                  onClick={() => fileInputRef.current.click()}
                >
                  <FaCamera size={20} />
                </div>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              
              <p className="text-muted small">Click the camera icon to change your profile picture</p>
            </div>
            
            <div className="col-md-8">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="first_name" className="form-label">
                    <FaUser className="me-2" />First Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={onChange}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="last_name" className="form-label">
                    <FaUser className="me-2" />Last Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={onChange}
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  <FaEnvelope className="me-2" />Email (Cannot be changed)
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  readOnly
                />
                <small className="text-muted">Your email address cannot be changed after registration</small>
              </div>
              
              <div className="mb-3">
                <label htmlFor="profile.bio" className="form-label">
                  <FaFileAlt className="me-2" />Bio
                </label>
                <textarea
                  className="form-control"
                  id="profile.bio"
                  name="profile.bio"
                  value={formData.profile.bio || ''}
                  onChange={onChange}
                  rows="3"
                  placeholder="Tell us about yourself (optional)"
                ></textarea>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="profile.location" className="form-label">
                    <FaMapMarkerAlt className="me-2" />Location
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="profile.location"
                    name="profile.location"
                    value={formData.profile.location || ''}
                    onChange={onChange}
                    placeholder="City, Country (optional)"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="profile.phone_number" className="form-label">
                    <FaPhone className="me-2" />Phone Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="profile.phone_number"
                    name="profile.phone_number"
                    value={formData.profile.phone_number || ''}
                    onChange={onChange}
                    placeholder="+1 (555) 123-4567 (optional)"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="d-flex justify-content-end mt-4 gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center"
              onClick={() => navigate('/profile')}
            >
              <FaTimes className="me-2" /> Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary d-flex align-items-center"
              disabled={updating}
            >
              {updating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="me-2" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;