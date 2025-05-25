import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TripService from '../../services/trip.service';
import PlaceSearch from './PlaceSearch';
import MediaGallery from './MediaGallery';
import MediaUpload from './MediaUpload';
import { 
  FaEdit, FaShare, FaMapMarkedAlt, FaRoute, FaImage, FaPlus, 
  FaCalendarAlt, FaMapMarkerAlt, FaClock, FaTrash, FaEye, FaUpload,
  FaSpinner, FaSave, FaExclamationTriangle
} from 'react-icons/fa';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const mapLoadTimeoutRef = useRef(null);
  
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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    fetchTripData();
    loadGoogleMapsScript();
    
    // Cleanup function
    return () => {
      if (mapLoadTimeoutRef.current) {
        clearTimeout(mapLoadTimeoutRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (mapLoaded && destinations.length > 0 && map) {
      displayRoute();
    }
  }, [mapLoaded, map, destinations]);

  const fetchTripData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`Fetching trip data for ID: ${id}`);
      
      const [tripResponse, destinationsResponse, mediaResponse] = await Promise.all([
        TripService.getTripById(id),
        TripService.getTripDestinations(id),
        TripService.getTripMedia(id)
      ]);
      
      console.log('Trip data fetched successfully:', tripResponse.data);
      
      setTrip(tripResponse.data);
      setDestinations(destinationsResponse.data);
      setMedia(mediaResponse.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching trip data:", error);
      
      // More detailed error handling
      if (error.response) {
        if (error.response.status === 404) {
          setError('Trip not found or you do not have access to this trip.');
        } else if (error.response.status === 401) {
          setError('You need to be logged in to view this trip.');
        } else {
          setError(`Error ${error.response.status}: ${error.response.data?.message || 'Failed to fetch trip data'}`);
        }
      } else if (error.request) {
        setError('Network error: Unable to connect to the server. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred while loading the trip.');
      }
      
      setLoading(false);
    }
  };

  const loadGoogleMapsScript = () => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      console.log("Google Maps API already loaded");
      setMapLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log("Google Maps script already exists, waiting for load...");
      
      // Set a timeout to check if it loads
      mapLoadTimeoutRef.current = setTimeout(() => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
        } else {
          setMapError('Google Maps API failed to load within timeout period.');
        }
      }, 10000); // 10 second timeout
      
      return;
    }

    console.log("Loading Google Maps API script...");
    
    try {
      // Get API key from environment variable
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('Google Maps API key not found in environment variables');
        setMapError('Google Maps API key not configured. Please check your environment variables.');
        return;
      }

      // Create script element to load Google Maps API
      const googleMapScript = document.createElement('script');
      googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      googleMapScript.async = true;
      googleMapScript.defer = true;
      
      // Handle script load event
      googleMapScript.addEventListener('load', () => {
        console.log("Google Maps API loaded successfully");
        setMapLoaded(true);
        setMapError('');
      });
      
      // Handle script error
      googleMapScript.addEventListener('error', (e) => {
        console.error('Failed to load Google Maps API:', e);
        setMapError('Failed to load Google Maps API. Please check your API key and internet connection.');
      });
      
      // Append script to document
      document.head.appendChild(googleMapScript);
      
    } catch (error) {
      console.error('Error creating Google Maps script:', error);
      setMapError('Error initializing Google Maps.');
    }
  };

  useEffect(() => {
    if (mapLoaded && mapRef.current && !map) {
      initializeMap();
    }
  }, [mapLoaded, map]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) {
      console.log("Map ref or Google Maps not available");
      return;
    }

    console.log("Initializing Google Maps");
    try {
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
        map: mapInstance
      });
      
      setMap(mapInstance);
      setDirectionsService(directionsServiceInstance);
      setDirectionsRenderer(directionsRendererInstance);
      googleMapRef.current = mapInstance;
      
      console.log("Map initialized successfully");
    } catch (err) {
      console.error("Error initializing map:", err);
      setMapError('Failed to initialize Google Maps. Please try refreshing the page.');
    }
  };

  const displayRoute = () => {
    if (!map || !directionsService || !directionsRenderer || destinations.length === 0) {
      console.log("Cannot display route: missing requirements", {
        map: !!map,
        directionsService: !!directionsService,
        directionsRenderer: !!directionsRenderer,
        destinationsCount: destinations.length
      });
      return;
    }

    console.log("Displaying route for", destinations.length, "destinations");

    try {
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
    } catch (err) {
      console.error("Error displaying route:", err);
      // Fallback to markers if there's an error
      showMarkersOnly();
    }
  };

  const showMarkersOnly = () => {
    if (!map || destinations.length === 0) return;

    console.log("Showing markers only");

    // Create bounds object to fit map to all markers
    const bounds = new window.google.maps.LatLngBounds();

    destinations.forEach((destination, index) => {
      const position = { lat: destination.latitude, lng: destination.longitude };
      
      // Add marker
      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        title: destination.name,
        label: (index + 1).toString()
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h6>${destination.name}</h6>
            <p>${destination.address}</p>
            ${destination.notes ? `<p><small>${destination.notes}</small></p>` : ''}
          </div>
        `
      });

      // Add click listener
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // Extend bounds to include this marker
      bounds.extend(position);
    });

    // Fit map to show all markers
    if (destinations.length > 0) {
      map.fitBounds(bounds);
      
      // If only one marker, zoom in appropriately
      if (destinations.length === 1) {
        map.setZoom(15);
      }
    }
  };

  const handleOptimizeRoute = async () => {
    if (destinations.length < 2) {
      setError('Need at least 2 destinations to optimize route');
      return;
    }

    setOptimizing(true);
    setError('');
    
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
      console.error('Route optimization error:', error);
      setError('Failed to optimize route. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleAddDestination = async (destination) => {
    try {
      await TripService.addDestination(id, destination);
      setMessage('Destination added successfully!');
      fetchTripData();
      setShowPlaceSearch(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Add destination error:', error);
      setError('Failed to add destination. Please try again.');
    }
  };

  const handleDeleteDestination = async (destinationId) => {
    if (window.confirm('Are you sure you want to remove this destination?')) {
      try {
        await TripService.deleteDestination(id, destinationId);
        setMessage('Destination removed successfully!');
        fetchTripData();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Delete destination error:', error);
        setError('Failed to remove destination. Please try again.');
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
      console.error('Media upload error:', error);
      setError('Failed to upload media. Please try again.');
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

  if (error && !trip) {
    return (
      <div className="alert alert-danger" role="alert">
        <FaExclamationTriangle className="me-2" />
        {error}
        <div className="mt-3">
          <button onClick={() => fetchTripData()} className="btn btn-outline-danger me-2">
            Retry
          </button>
          <Link to="/trips" className="btn btn-secondary">
            Back to Trips
          </Link>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="alert alert-warning" role="alert">
        <FaExclamationTriangle className="me-2" />
        Trip not found or you don't have access to this trip.
        <div className="mt-3">
          <Link to="/trips" className="btn btn-secondary">
            Back to Trips
          </Link>
        </div>
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
              {/* Map Error Display */}
              {mapError && (
                <div className="alert alert-warning m-3" role="alert">
                  <FaExclamationTriangle className="me-2" />
                  {mapError}
                  <div className="mt-2">
                    <button 
                      onClick={() => {
                        setMapError('');
                        loadGoogleMapsScript();
                      }} 
                      className="btn btn-sm btn-outline-warning"
                    >
                      Retry Loading Maps
                    </button>
                  </div>
                </div>
              )}
              
              {/* Google Maps Container */}
              <div 
                ref={mapRef} 
                style={{ 
                  width: '100%', 
                  height: '500px',
                  backgroundColor: '#f8f9fa'
                }}
                className="rounded-bottom"
              >
                {!mapLoaded && !mapError && (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="text-center">
                      <FaSpinner className="fa-spin text-primary mb-2" size={24} />
                      <p className="text-muted">Loading Google Maps...</p>
                    </div>
                  </div>
                )}
              </div>
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
          {(trip.total_distance || destinations.length > 0) && (
            <div className="card mt-3">
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-4">
                    <h5 className="text-primary">{destinations.length}</h5>
                    <small className="text-muted">Destinations</small>
                  </div>
                  <div className="col-4">
                    <h5 className="text-primary">
                      {trip.total_distance ? `${trip.total_distance.toFixed(1)} km` : 'N/A'}
                    </h5>
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