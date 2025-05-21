// src/components/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { FaPlaneDeparture, FaMapMarkedAlt, FaCalendarAlt, FaUsers } from 'react-icons/fa';

const Home = () => {
  const currentUser = AuthService.getCurrentUser();

  const features = [
    {
      icon: <FaPlaneDeparture size={48} className="text-primary mb-3" />,
      title: "Trip Planning",
      description: "Plan your perfect trip with customizable itineraries, flights, accommodations, and activities all in one place."
    },
    {
      icon: <FaMapMarkedAlt size={48} className="text-primary mb-3" />,
      title: "Destination Discovery",
      description: "Explore popular and off-the-beaten-path destinations with local insights and recommendations."
    },
    {
      icon: <FaCalendarAlt size={48} className="text-primary mb-3" />,
      title: "Travel Timeline",
      description: "Organize your travel schedule with our intuitive timeline that keeps all your plans neatly arranged."
    },
    {
      icon: <FaUsers size={48} className="text-primary mb-3" />,
      title: "Group Travel",
      description: "Invite friends and family to collaborate on trip planning and share expenses easily."
    }
  ];

  const destinations = [
    { name: "Paris", image: "https://source.unsplash.com/random/300x200/?paris", tag: "Cultural" },
    { name: "Bali", image: "https://source.unsplash.com/random/300x200/?bali", tag: "Beach" },
    { name: "Tokyo", image: "https://source.unsplash.com/random/300x200/?tokyo", tag: "Urban" },
    { name: "Swiss Alps", image: "https://source.unsplash.com/random/300x200/?alps", tag: "Adventure" }
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="jumbotron">
        <h1 className="display-4">Adventure Begins with TripMate</h1>
        <p className="lead">
          Your ultimate travel companion for planning, organizing, and sharing memorable journeys.
        </p>
        <p>
          Seamlessly plan your next adventure with TripMate's intelligent tools and personalized recommendations.
        </p>
        <div className="d-flex gap-2 justify-content-center">
          {currentUser ? (
            <Link to="/profile" className="btn btn-primary btn-lg">
              Plan Your Next Trip
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Start Your Journey
              </Link>
              <Link to="/login" className="btn btn-outline-light">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Features Section */}
      <section className="mb-5">
        <h2 className="text-center mb-4">Why Choose TripMate</h2>
        <div className="row g-4">
          {features.map((feature, index) => (
            <div key={index} className="col-md-6 col-lg-3">
              <div className="card h-100 text-center p-4">
                <div className="card-body d-flex flex-column">
                  {feature.icon}
                  <h3 className="h5 mb-3">{feature.title}</h3>
                  <p className="text-muted mb-4">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Popular Destinations</h2>
          <Link to="/destinations" className="btn btn-outline-primary">View All</Link>
        </div>
        <div className="row g-4">
          {destinations.map((destination, index) => (
            <div key={index} className="col-md-6 col-lg-3">
              <div className="card h-100 trip-card border-0 overflow-hidden">
                <img 
                  src={destination.image} 
                  className="card-img-top" 
                  alt={destination.name}
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">{destination.name}</h5>
                    <span className="badge bg-primary">{destination.tag}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-light p-5 rounded-lg mt-5 text-center">
        <h2 className="mb-3">Ready to Start Your Adventure?</h2>
        <p className="lead mb-4">Join thousands of travelers creating unforgettable experiences with TripMate.</p>
        {!currentUser && (
          <Link to="/register" className="btn btn-primary btn-lg">
            Sign Up Now - It's Free!
          </Link>
        )}
      </section>
    </div>
  );
};

export default Home;