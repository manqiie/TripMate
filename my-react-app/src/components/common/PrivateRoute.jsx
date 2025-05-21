// src/components/common/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthService from '../../services/auth.service';

const PrivateRoute = ({ children }) => {
  const currentUser = AuthService.getCurrentUser();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default PrivateRoute;