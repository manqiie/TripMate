// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../services/auth.service';

const Home = () => {
  const currentUser = AuthService.getCurrentUser();

  return (
    <div className="jumbotron">
      <h1 className="display-4">Welcome to TripMate!</h1>
      <p className="lead">
        Your ultimate travel companion for planning, organizing, and sharing your trips.
      </p>
      <hr className="my-4" />
      <p>
        Plan your next adventure with TripMate. Create an account to get started.
      </p>
      <div className="d-flex gap-2">
        {currentUser ? (
          <Link to="/profile" className="btn btn-primary">
            Go to Your Profile
          </Link>
        ) : (
          <>
            <Link to="/register" className="btn btn-primary">
              Sign Up Now
            </Link>
            <Link to="/login" className="btn btn-outline-secondary">
              Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;