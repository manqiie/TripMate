// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserService from '../../services/user.service';
import { FaUsers, FaEnvelope, FaPlaneDeparture, FaChartLine, FaCalendarAlt, FaCog } from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    contacts: 0,
    trips: 0,
    pending: 0
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch this data from your API
    // This is just sample data for demonstration
    const fetchStats = async () => {
      try {
        // Simulate fetching stats from server
        const usersResponse = await UserService.getAllUsers();
        const contactsResponse = await UserService.getAllContacts();
        
        setStats({
          users: usersResponse.data.length,
          contacts: contactsResponse.data.length,
          trips: 148, // Sample data
          pending: contactsResponse.data.filter(c => !c.is_resolved).length
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const dashboardItems = [
    {
      title: "User Management",
      icon: <FaUsers className="display-4 text-primary mb-3" />,
      description: "Manage user accounts, profiles, and permissions. View and modify user information.",
      link: "/admin/users",
      linkText: "Manage Users",
      count: stats.users,
      countLabel: "Total Users"
    },
    {
      title: "Contact Submissions",
      icon: <FaEnvelope className="display-4 text-primary mb-3" />,
      description: "View and respond to user inquiries and contact form submissions.",
      link: "/admin/contacts",
      linkText: "View Contacts",
      count: stats.contacts,
      countLabel: "Contact Messages",
      highlight: stats.pending > 0,
      badge: stats.pending > 0 ? `${stats.pending} pending` : null
    },
    {
      title: "Trip Management",
      icon: <FaPlaneDeparture className="display-4 text-primary mb-3" />,
      description: "Manage user trips, itineraries, and bookings across the platform.",
      link: "/admin/trips",
      linkText: "Manage Trips",
      count: stats.trips,
      countLabel: "Active Trips"
    },
    {
      title: "System Settings",
      icon: <FaCog className="display-4 text-primary mb-3" />,
      description: "Configure system settings, API integrations, and platform preferences.",
      link: "/admin/settings",
      linkText: "System Settings"
    }
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="mb-0">Admin Dashboard</h2>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 col-lg-3 mb-4">
              <div className="card border-0 bg-primary text-white">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-uppercase">Users</h6>
                    <h2 className="mb-0">{stats.users}</h2>
                  </div>
                  <FaUsers size={36} opacity={0.6} />
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3 mb-4">
              <div className="card border-0 bg-success text-white">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-uppercase">Trips</h6>
                    <h2 className="mb-0">{stats.trips}</h2>
                  </div>
                  <FaPlaneDeparture size={36} opacity={0.6} />
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3 mb-4">
              <div className="card border-0 bg-warning text-white">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-uppercase">Messages</h6>
                    <h2 className="mb-0">{stats.contacts}</h2>
                  </div>
                  <FaEnvelope size={36} opacity={0.6} />
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3 mb-4">
              <div className="card border-0 bg-info text-white">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-uppercase">Bookings</h6>
                    <h2 className="mb-0">89</h2>
                  </div>
                  <FaCalendarAlt size={36} opacity={0.6} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row g-4">
        {dashboardItems.map((item, index) => (
          <div key={index} className="col-md-6 mb-4">
            <div className="card h-100 dashboard-card">
              <div className="card-body">
                <div className="text-center">
                  {item.icon}
                  <h3>{item.title}</h3>
                  {item.count !== undefined && (
                    <div className="mb-3">
                      <span className="display-6 fw-bold">{item.count}</span>
                      <span className="text-muted ms-2">{item.countLabel}</span>
                      {item.badge && (
                        <span className="ms-2 badge bg-danger">{item.badge}</span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-muted text-center">{item.description}</p>
                <div className="text-center">
                  <Link to={item.link} className={`btn ${item.highlight ? 'btn-warning' : 'btn-primary'}`}>
                    {item.linkText}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="card mt-4">
        <div className="card-header">
          <h2 className="mb-0">Quick Analytics</h2>
        </div>
        <div className="card-body">
          <div className="d-flex justify-content-center align-items-center p-4">
            <FaChartLine size={48} className="text-muted" />
            <p className="ms-3 mb-0">Analytics dashboard is in development. Coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;