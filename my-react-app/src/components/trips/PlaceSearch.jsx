// src/components/trips/PlaceSearch.jsx
import React, { useState, useRef, useEffect } from 'react';
import TripService from '../../services/trip.service';
import { FaSearch, FaMapMarkerAlt, FaStar, FaPlus, FaSpinner } from 'react-icons/fa';

const PlaceSearch = ({ onPlaceSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const searchTimeoutRef = useRef(null);

  // Form data for selected place
  const [placeForm, setPlaceForm] = useState({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    place_id: '',
    notes: '',
    visit_date: '',
    visit_time: '',
    duration_minutes: 60
  });

  useEffect(() => {
    if (query.length >= 3) {
      // Debounce search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces();
      }, 500);
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const searchPlaces = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await TripService.searchPlaces({
        query: query.trim(),
        // You can add location bias here if needed
        // location: { lat: 37.7749, lng: -122.4194 },
        radius: 50000
      });

      setResults(response.data || []);
    } catch (error) {
      setError('Failed to search places. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSelect = (place) => {
    setSelectedPlace(place);
    setPlaceForm({
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      place_id: place.place_id,
      notes: '',
      visit_date: '',
      visit_time: '',
      duration_minutes: estimateVisitDuration(place.types)
    });
    setResults([]);
    setQuery('');
  };

  const estimateVisitDuration = (types = []) => {
    const typeDurations = {
      'museum': 120,
      'amusement_park': 240,
      'zoo': 180,
      'park': 90,
      'restaurant': 90,
      'tourist_attraction': 120,
      'shopping_mall': 120,
      'church': 45,
      'art_gallery': 90,
      'aquarium': 120,
    };

    for (const type of types) {
      if (typeDurations[type]) {
        return typeDurations[type];
      }
    }
    return 60; // Default 1 hour
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPlaceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPlace = () => {
    if (!selectedPlace) return;

    onPlaceSelect(placeForm);
    setSelectedPlace(null);
    setPlaceForm({
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      place_id: '',
      notes: '',
      visit_date: '',
      visit_time: '',
      duration_minutes: 60
    });
  };

  const handleCancel = () => {
    setSelectedPlace(null);
    setQuery('');
    setResults([]);
  };

  return (
    <div>
      {!selectedPlace ? (
        // Search Interface
        <div>
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search for places, attractions, restaurants..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {query.length > 0 && query.length < 3 && (
              <small className="text-muted">Type at least 3 characters to search</small>
            )}
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center py-3">
              <FaSpinner className="fa-spin me-2" />
              Searching places...
            </div>
          )}

          {results.length > 0 && (
            <div className="list-group">
              {results.map((place, index) => (
                <button
                  key={place.place_id || index}
                  className="list-group-item list-group-item-action"
                  onClick={() => handlePlaceSelect(place)}
                >
                  <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                      {place.photos && place.photos.length > 0 ? (
                        <img
                          src={place.photos[0].url}
                          alt={place.name}
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                          className="rounded"
                        />
                      ) : (
                        <div 
                          className="bg-light d-flex align-items-center justify-content-center rounded"
                          style={{ width: '60px', height: '60px' }}
                        >
                          <FaMapMarkerAlt className="text-muted" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{place.name}</h6>
                      <p className="mb-1 text-muted small">{place.address}</p>
                      <div className="d-flex align-items-center">
                        {place.rating && (
                          <div className="me-3">
                            <FaStar className="text-warning me-1" />
                            <small>{place.rating}</small>
                            {place.user_ratings_total && (
                              <small className="text-muted"> ({place.user_ratings_total})</small>
                            )}
                          </div>
                        )}
                        {place.types && place.types.length > 0 && (
                          <div>
                            <span className="badge bg-secondary">
                              {place.types[0].replace(/_/g, ' ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Place Details Form
        <div>
          <div className="card">
            <div className="card-header">
              <h5>Add Destination: {selectedPlace.name}</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-8">
                  <div className="mb-3">
                    <label className="form-label">Place Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={placeForm.name}
                      onChange={handleFormChange}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      name="address"
                      value={placeForm.address}
                      onChange={handleFormChange}
                      rows="2"
                      readOnly
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Notes (Optional)</label>
                    <textarea
                      className="form-control"
                      name="notes"
                      value={placeForm.notes}
                      onChange={handleFormChange}
                      rows="3"
                      placeholder="Add any notes about this destination..."
                    />
                  </div>
                </div>
                
                <div className="col-md-4">
                  {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                    <div className="mb-3">
                      <img
                        src={selectedPlace.photos[0].url}
                        alt={selectedPlace.name}
                        className="img-fluid rounded"
                        style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  
                  {selectedPlace.rating && (
                    <div className="mb-3">
                      <div className="d-flex align-items-center">
                        <FaStar className="text-warning me-2" />
                        <span>{selectedPlace.rating}</span>
                        {selectedPlace.user_ratings_total && (
                          <small className="text-muted ms-2">
                            ({selectedPlace.user_ratings_total} reviews)
                          </small>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Visit Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    name="visit_date"
                    value={placeForm.visit_date}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Visit Time (Optional)</label>
                  <input
                    type="time"
                    className="form-control"
                    name="visit_time"
                    value={placeForm.visit_time}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Duration (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="duration_minutes"
                    value={placeForm.duration_minutes}
                    onChange={handleFormChange}
                    min="15"
                    step="15"
                  />
                </div>
              </div>
              
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddPlace}
                >
                  <FaPlus className="me-2" />
                  Add to Trip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceSearch;