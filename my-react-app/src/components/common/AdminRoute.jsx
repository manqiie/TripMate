// src/components/common/AdminRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthService from '../../services/auth.service';

const AdminRoute = ({ children }) => {
  const currentUser = AuthService.getCurrentUser();
  
  if (!currentUser || !currentUser.is_staff) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default AdminRoute;