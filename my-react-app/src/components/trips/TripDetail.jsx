// src/components/trips/TripDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TripService from '../../services/trip.service';
import PlaceSearch from './PlaceSearch';
import MediaGallery from './MediaGallery';
import MediaUpload from './MediaUpload';
import { 
  FaEdit, FaShare, FaMapMarkedAlt, FaRoute, FaImage, FaPlus, 
  FaCalendarAlt, FaMapMarkerAlt, FaClock, FaTrash, FaEye, FaUpload,
  FaSpinner, FaOptimize, FaSave
} from 'react-icons/fa';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  
  const [trip, setTrip] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  
  // Map state
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  useEffect(() => {
    fetchTripData();
    initializeGoogleMaps();
  }, [id]);

  useEffect(() => {
    if (map && destinations.length > 0) {
      displayRoute();
    }
  }, [map, destinations]);

  const fetchTripData = async () => {
    try {
      setLoading(true);
      const [tripResponse, destinationsResponse, mediaResponse] = await Promise.all([
        TripService.getTripById(id),
        TripService.getTripDestinations(id),
        TripService.getTripMedia(id)
      ]);
      
      setTrip(tripResponse.data);
      setDestinations(destinationsResponse.data);
      setMedia(mediaResponse.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch trip data');
      setLoading(false);
    }
  };

  const initializeGoogleMaps = () => {
    if (window.google && window.google.maps) {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 10,
        center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      const directionsServiceInstance = new window.google.maps.DirectionsService();
      const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
        draggable: true,
        panel: document.getElementById('directionsPanel')
      });

      directionsRendererInstance.setMap(mapInstance);
      
      setMap(mapInstance);
      setDirectionsService(directionsServiceInstance);
      setDirectionsRenderer(directionsRendererInstance);
      googleMapRef.current = mapInstance;
    } else {
      // Load Google Maps API if not already loaded
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.onload = initializeGoogleMaps;
      document.head.appendChild(script);
    }
  };

  const displayRoute = () => {
    if (!map || !directionsService || !directionsRenderer || destinations.length === 0) {
      return;
    }

    // Clear existing route
    directionsRenderer.setDirections({ routes: [] });

    if (destinations.length === 1) {
      // Single destination - just show marker
      const marker = new window.google.maps.Marker({
        position: { lat: destinations[0].latitude, lng: destinations[0].longitude },
        map: map,
        title: destinations[0].name
      });
      
      map.setCenter({ lat: destinations[0].latitude, lng: destinations[0].longitude });
      map.setZoom(15);
      return;
    }

    // Multiple destinations - show route
    const sortedDestinations = [...destinations].sort((a, b) => a.order_index - b.order_index);
    
    if (sortedDestinations.length >= 2) {
      const origin = { lat: sortedDestinations[0].latitude, lng: sortedDestinations[0].longitude };
      const destination = { 
        lat: sortedDestinations[sortedDestinations.length - 1].latitude, 
        lng: sortedDestinations[sortedDestinations.length - 1].longitude 
      };
      
      const waypoints = sortedDestinations.slice(1, -1).map(dest => ({
        location: { lat: dest.latitude, lng: dest.longitude },
        stopover: true
      }));

      const request = {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidTolls: true
      };

      directionsService.route(request, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
        } else {
          console.error('Directions request failed:', status);
          // Fallback to showing markers
          showMarkersOnly();
        }
      });
    }
  };

  const showMarkersOnly = () => {
    destinations.forEach((destination, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: destination.latitude, lng: destination.longitude },
        map: map,
        title: destination.name,
        label: (index + 1).toString()
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h6>${destination.name}</h6>
            <p>${destination.address}</p>
            ${destination.notes ? `<p><small>${destination.notes}</small></p>` : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });

    // Fit map to show all markers
    if (destinations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      destinations.forEach(dest => {
        bounds.extend({ lat: dest.latitude, lng: dest.longitude });
      });
      map.fitBounds(bounds);
    }
  };

  const handleOptimizeRoute = async () => {
    if (destinations.length < 2) {
      setError('Need at least 2 destinations to optimize route');
      return;
    }

    setOptimizing(true);
    try {
      const response = await TripService.optimizeRoute(id);
      if (response.data.success) {
        setMessage('Route optimized successfully!');
        fetchTripData(); // Refresh data to get new order
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(response.data.error || 'Failed to optimize route');
      }
    } catch (error) {
      setError('Failed to optimize route');
    } finally {
      setOptimizing(false);
    }
  };

  const handleAddDestination = (destination) => {
    TripService.addDestination(id, destination)
      .then(() => {
        setMessage('Destination added successfully!');
        fetchTripData();
        setShowPlaceSearch(false);
        setTimeout(() => setMessage(''), 3000);
      })
      .catch(error => {
        setError('Failed to add destination');
      });
  };

  const handleDeleteDestination = async (destinationId) => {
    if (window.confirm('Are you sure you want to remove this destination?')) {
      try {
        await TripService.deleteDestination(id, destinationId);
        setMessage('Destination removed successfully!');
        fetchTripData();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setError('Failed to remove destination');
      }
    }
  };

  const handleMediaUpload = async (mediaFile, metadata) => {
    try {
      await TripService.uploadMedia(id, {
        file: mediaFile,
        ...metadata
      });
      setMessage('Media uploaded successfully!');
      fetchTripData();
      setShowMediaUpload(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError('Failed to upload media');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading trip...</span>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="alert alert-danger" role="alert">
        Trip not found or access denied.
      </div>
    );
  }

  return (
    <div>
      {/* Trip Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>{trip.title}</h1>
          {trip.description && (
            <p className="text-muted">{trip.description}</p>
          )}
        </div>
        <div className="btn-group">
          <Link to={`/trips/${id}/edit`} className="btn btn-outline-primary">
            <FaEdit className="me-2" />
            Edit
          </Link>
          <button className="btn btn-outline-success" title="Share Trip">
            <FaShare />
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="row">
        {/* Map Column */}
        <div className="col-lg-8 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3>
                <FaMapMarkedAlt className="me-2" />
                Route Map
              </h3>
              <div className="btn-group">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setShowPlaceSearch(!showPlaceSearch)}
                >
                  <FaPlus className="me-1" />
                  Add Place
                </button>
                <button 
                  className="btn btn-outline-info btn-sm"
                  onClick={handleOptimizeRoute}
                  disabled={optimizing || destinations.length < 2}
                >
                  {optimizing ? (
                    <FaSpinner className="me-1 fa-spin" />
                  ) : (
                    <FaRoute className="me-1" />
                  )}
                  Optimize Route
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              {/* Google Maps Container */}
              <div 
                ref={mapRef} 
                style={{ width: '100%', height: '500px' }}
                className="rounded-bottom"
              ></div>
            </div>
          </div>

          {/* Place Search Component */}
          {showPlaceSearch && (
            <div className="card mt-3">
              <div className="card-header">
                <h5>Search and Add Places</h5>
              </div>
              <div className="card-body">
                <PlaceSearch onPlaceSelect={handleAddDestination} />
              </div>
            </div>
          )}

          {/* Route Information */}
          {trip.total_distance && (
            <div className="card mt-3">
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-4">
                    <h5 className="text-primary">{destinations.length}</h5>
                    <small className="text-muted">Destinations</small>
                  </div>
                  <div className="col-4">
                    <h5 className="text-primary">{trip.total_distance.toFixed(1)} km</h5>
                    <small className="text-muted">Total Distance</small>
                  </div>
                  <div className="col-4">
                    <h5 className="text-primary">
                      {trip.total_duration ? `${Math.floor(trip.total_duration / 60)}h ${trip.total_duration % 60}m` : 'N/A'}
                    </h5>
                    <small className="text-muted">Estimated Time</small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Trip Info */}
          <div className="card mb-4">
            <div className="card-header">
              <h5>Trip Information</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Status:</strong>
                <span className={`badge ms-2 bg-${getStatusColor(trip.status)}`}>
                  {trip.status}
                </span>
              </div>
              {trip.start_date && (
                <div className="mb-3">
                  <strong>
                    <FaCalendarAlt className="me-2" />
                    Dates:
                  </strong>
                  <div className="mt-1">
                    {new Date(trip.start_date).toLocaleDateString()}
                    {trip.end_date && trip.end_date !== trip.start_date && (
                      <> - {new Date(trip.end_date).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
              )}
              <div className="mb-3">
                <strong>Privacy:</strong>
                <span className="ms-2">{trip.privacy}</span>
              </div>
            </div>
          </div>

          {/* Destinations List */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5>Destinations ({destinations.length})</h5>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => setShowPlaceSearch(!showPlaceSearch)}
              >
                <FaPlus />
              </button>
            </div>
            <div className="card-body p-0">
              {destinations.length === 0 ? (
                <div className="p-3 text-center text-muted">
                  <FaMapMarkerAlt size={32} className="mb-2" />
                  <p>No destinations added yet.</p>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowPlaceSearch(!showPlaceSearch)}
                  >
                    Add Your First Destination
                  </button>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {destinations
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((destination, index) => (
                    <div key={destination.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-1">
                            <span className="badge bg-primary me-2">{index + 1}</span>
                            <h6 className="mb-0">{destination.name}</h6>
                          </div>
                          <p className="mb-1 text-muted small">{destination.address}</p>
                          {destination.notes && (
                            <p className="mb-1 text-muted small">
                              <em>{destination.notes}</em>
                            </p>
                          )}
                          {destination.visit_date && (
                            <small className="text-muted">
                              <FaCalendarAlt className="me-1" />
                              {new Date(destination.visit_date).toLocaleDateString()}
                              {destination.visit_time && (
                                <>
                                  <FaClock className="ms-2 me-1" />
                                  {destination.visit_time}
                                </>
                              )}
                            </small>
                          )}
                        </div>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteDestination(destination.id)}
                          title="Remove destination"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Media Section */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5>
                <FaImage className="me-2" />
                Media ({media.length})
              </h5>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => setShowMediaUpload(!showMediaUpload)}
              >
                <FaUpload />
              </button>
            </div>
            <div className="card-body">
              {showMediaUpload && (
                <div className="mb-3">
                  <MediaUpload onUpload={handleMediaUpload} destinations={destinations} />
                </div>
              )}
              <MediaGallery media={media} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status) => {
  const colors = {
    'planning': 'primary',
    'upcoming': 'warning',
    'ongoing': 'info',
    'completed': 'success',
    'cancelled': 'secondary'
  };
  return colors[status] || 'secondary';
};

export default TripDetail;