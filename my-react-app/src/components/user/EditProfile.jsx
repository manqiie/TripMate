// src/components/user/EditProfile.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UserService from '../../services/user.service';

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

  const onSubmit = e => {
    e.preventDefault();
    setUpdating(true);
    setMessage('');
    
    // Create a FormData object for file upload
    const formDataToSend = new FormData();
    formDataToSend.append('first_name', formData.first_name);
    formDataToSend.append('last_name', formData.last_name);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('profile.bio', formData.profile.bio || '');
    formDataToSend.append('profile.location', formData.profile.location || '');
    formDataToSend.append('profile.phone_number', formData.profile.phone_number || '');
    
    if (formData.profile.profile_picture && typeof formData.profile.profile_picture !== 'string') {
      formDataToSend.append('profile.profile_picture', formData.profile.profile_picture);
    }

    UserService.updateUserProfile(formDataToSend)
      .then(response => {
        setIsSuccess(true);
        setMessage('Profile updated successfully!');
        setUpdating(false);
        
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
        setUpdating(false);
      });
  };

  if (loading) {
    return <div>Loading profile data...</div>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Edit Profile</h2>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'}`} role="alert">
            {message}
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div className="row">
            <div className="col-md-4 text-center mb-4">
              {previewImage ? (
                <img 
                  src={previewImage} 
                  alt="Profile Preview" 
                  className="img-fluid rounded-circle mb-3"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
              ) : (
                <div 
                  className="rounded-circle bg-secondary d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: '150px', height: '150px' }}
                >
                  <span className="text-white fs-1">
                    {formData.first_name && formData.first_name[0]}
                    {formData.last_name && formData.last_name[0]}
                  </span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => fileInputRef.current.click()}
              >
                Change Profile Picture
              </button>
            </div>
            <div className="col-md-8">
              <div className="mb-3">
                <label htmlFor="first_name" className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="last_name" className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="profile.bio" className="form-label">Bio</label>
                <textarea
                  className="form-control"
                  id="profile.bio"
                  name="profile.bio"
                  value={formData.profile.bio || ''}
                  onChange={onChange}
                  rows="3"
                ></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="profile.location" className="form-label">Location</label>
                <input
                  type="text"
                  className="form-control"
                  id="profile.location"
                  name="profile.location"
                  value={formData.profile.location || ''}
                  onChange={onChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="profile.phone_number" className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  id="profile.phone_number"
                  name="profile.phone_number"
                  value={formData.profile.phone_number || ''}
                  onChange={onChange}
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
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;