// src/App.jsx - Updated with trip routes
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/user/Profile';
import EditProfile from './components/user/EditProfile';
import ChangePassword from './components/user/ChangePassword';
import ResetPassword from './components/auth/ResetPassword';
import ResetPasswordConfirm from './components/auth/ResetPasswordConfirm';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUserList from './components/admin/AdminUserList';
import AdminUserEdit from './components/admin/AdminUserEdit';
import AdminContactList from './components/admin/AdminContactList';
import ContactForm from './components/user/ContactForm';

// Trip components
import TripList from './components/trips/TripList';
import TripCreate from './components/trips/TripCreate';
import TripDetail from './components/trips/TripDetail';
import TripEdit from './components/trips/TripEdit';

import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';
import AuthService from './services/auth.service';
import UserService from './services/user.service';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      // Fetch fresh user data to get updated profile picture
      UserService.getUserProfile()
        .then(response => {
          // Update the stored user data with fresh profile data
          const updatedUser = { ...user, ...response.data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
        })
        .catch(error => {
          console.error('Error fetching user profile:', error);
          setCurrentUser(user); // Fallback to stored user data
        });
    }
    setLoading(false);
  }, []);

  const logOut = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  const updateCurrentUser = (updatedUserData) => {
    // Update the current user state and localStorage
    const updatedUser = { ...currentUser, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navbar currentUser={currentUser} logOut={logOut} />
        <main className="container mt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={
              currentUser ? <Navigate to="/profile" /> : <Login setCurrentUser={setCurrentUser} />
            } />
            <Route path="/register" element={
              currentUser ? <Navigate to="/profile" /> : <Register setCurrentUser={setCurrentUser} />
            } />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/contact" element={<ContactForm />} />
            
            {/* Protected User Routes */}
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile currentUser={currentUser} />
              </PrivateRoute>
            } />
            <Route path="/edit-profile" element={
              <PrivateRoute>
                <EditProfile currentUser={currentUser} updateCurrentUser={updateCurrentUser} />
              </PrivateRoute>
            } />
            <Route path="/change-password" element={
              <PrivateRoute>
                <ChangePassword />
              </PrivateRoute>
            } />
            
            {/* Trip Routes */}
            <Route path="/trips" element={
              <PrivateRoute>
                <TripList />
              </PrivateRoute>
            } />
            <Route path="/trips/new" element={
              <PrivateRoute>
                <TripCreate />
              </PrivateRoute>
            } />
            <Route path="/trips/:id" element={
              <PrivateRoute>
                <TripDetail />
              </PrivateRoute>
            } />
            <Route path="/trips/:id/edit" element={
              <PrivateRoute>
                <TripEdit />
              </PrivateRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <AdminUserList />
              </AdminRoute>
            } />
            <Route path="/admin/users/:id" element={
              <AdminRoute>
                <AdminUserEdit />
              </AdminRoute>
            } />
            <Route path="/admin/contacts" element={
              <AdminRoute>
                <AdminContactList />
              </AdminRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;