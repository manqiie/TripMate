// src/services/user.service.js

import apiClient from './api';

const UserService = {
  getUserProfile: () => {
    return apiClient.get('accounts/profile/');
  },

  updateUserProfile: (userData) => {
    // Using PATCH instead of PUT for partial updates
    return apiClient.patch('accounts/profile/', userData);
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