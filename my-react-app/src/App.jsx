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
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';
import AuthService from './services/auth.service';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const logOut = () => {
    AuthService.logout();
    setCurrentUser(null);
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
            <Route path="/reset-password-confirm/:uid/:token" element={<ResetPasswordConfirm />} />
            <Route path="/contact" element={<ContactForm />} />
            
            {/* Protected User Routes */}
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile currentUser={currentUser} />
              </PrivateRoute>
            } />
            <Route path="/edit-profile" element={
              <PrivateRoute>
                <EditProfile currentUser={currentUser} />
              </PrivateRoute>
            } />
            <Route path="/change-password" element={
              <PrivateRoute>
                <ChangePassword />
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