// src/services/auth.service.js

import apiClient from './api';

const AuthService = {
  register: (username, email, password, firstName, lastName) => {
    return apiClient.post('accounts/register/', {
      username,
      email,
      password,
      password2: password,
      first_name: firstName,
      last_name: lastName
    });
  },

  login: (username, password) => {
    return apiClient.post('accounts/login/', {
      username,
      password
    }).then(response => {
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    });
  },

  logout: () => {
    return apiClient.post('accounts/logout/').then(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAdmin: () => {
    const user = AuthService.getCurrentUser();
    return user && user.is_staff;
  },
  
  // New password reset methods
  requestPasswordReset: (email) => {
    return apiClient.post('accounts/password-reset-request/', { email });
  },
  
  verifyPasswordResetToken: (email, token, newPassword) => {
    return apiClient.post('accounts/password-reset-verify/', {
      email,
      token,
      new_password: newPassword
    });
  }
};

export default AuthService;