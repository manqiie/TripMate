// src/components/admin/AdminDashboard.js
import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Admin Dashboard</h2>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-body">
                <h3>User Management</h3>
                <p>Manage user accounts, profiles, and permissions.</p>
                <Link to="/admin/users" className="btn btn-primary">Manage Users</Link>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-body">
                <h3>Contact Submissions</h3>
                <p>View and respond to user inquiries and contact form submissions.</p>
                <Link to="/admin/contacts" className="btn btn-primary">View Contacts</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
