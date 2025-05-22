// src/services/user.service.js - Updated profile update method

import apiClient from './api';

const UserService = {
  getUserProfile: () => {
    return apiClient.get('accounts/profile/');
  },

  updateUserProfile: (userData) => {
    // Log the data being sent
    console.log('Sending profile update data:', userData);
    
    // Create a new FormData if we're not already using one
    let formData;
    if (userData instanceof FormData) {
      formData = userData;
    } else {
      formData = new FormData();
      
      // Append all the data to FormData
      Object.keys(userData).forEach(key => {
        if (userData[key] !== null && userData[key] !== undefined) {
          if (key === 'profile_picture' && userData[key] instanceof File) {
            formData.append(key, userData[key], userData[key].name);
          } else {
            formData.append(key, userData[key]);
          }
        }
      });
    }
    
    // Log FormData contents
    console.log('FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ':', pair[1]);
    }
    
    // Using PATCH instead of PUT for partial updates
    return apiClient.patch('accounts/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  changePassword: (oldPassword, newPassword) => {
    return apiClient.put('accounts/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password2: newPassword
    });
  },

  // Admin methods
  getAllUsers: () => {
    return apiClient.get('accounts/admin/users/');
  },

  getUserById: (id) => {
    return apiClient.get(`accounts/admin/users/${id}/`);
  },

  updateUser: (id, userData) => {
    return apiClient.patch(`accounts/admin/users/${id}/`, userData);
  },

  resetUserPassword: (id, newPassword) => {
    return apiClient.post(`accounts/admin/users/${id}/reset-password/`, {
      new_password: newPassword,
    });
  },

  deleteUser: (id) => {
    return apiClient.delete(`accounts/admin/users/${id}/`);
  },

  // Contact form
  submitContactForm: (name, email, subject, message) => {
    return apiClient.post('accounts/contact/', {
      name,
      email,
      subject,
      message
    });
  },

  // Admin contact methods
  getAllContacts: () => {
    return apiClient.get('accounts/admin/contacts/');
  },

  updateContactStatus: (id, isResolved) => {
    return apiClient.patch(`accounts/admin/contacts/${id}/`, {
      is_resolved: isResolved
    });
  }
};

export default UserService;