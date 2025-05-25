// src/services/trip.service.js

import apiClient from './api';

const TripService = {
  // Trip CRUD operations
  getTrips: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();
    return apiClient.get(`trips/${queryString ? `?${queryString}` : ''}`);
  },

  getTripById: (tripId) => {
    return apiClient.get(`trips/${tripId}/`);
  },

  createTrip: (tripData) => {
    return apiClient.post('trips/', tripData);
  },

  updateTrip: (tripId, tripData) => {
    return apiClient.patch(`trips/${tripId}/`, tripData);
  },

  deleteTrip: (tripId) => {
    return apiClient.delete(`trips/${tripId}/`);
  },

  duplicateTrip: (tripId) => {
    return apiClient.post(`trips/${tripId}/duplicate/`);
  },

  // Destination operations
  getTripDestinations: (tripId) => {
    return apiClient.get(`trips/${tripId}/destinations/`);
  },

  addDestination: (tripId, destinationData) => {
    return apiClient.post(`trips/${tripId}/add_destination/`, destinationData);
  },

  addDestinationsBulk: (tripId, destinationsData) => {
    return apiClient.post(`trips/${tripId}/add_destinations_bulk/`, destinationsData);
  },

  updateDestination: (tripId, destinationId, destinationData) => {
    return apiClient.patch(`trips/${tripId}/destinations/${destinationId}/`, destinationData);
  },

  deleteDestination: (tripId, destinationId) => {
    return apiClient.delete(`trips/${tripId}/destinations/${destinationId}/`);
  },

  reorderDestinations: (tripId, destinationIds) => {
    return apiClient.post(`trips/${tripId}/destinations/reorder/`, {
      destination_ids: destinationIds
    });
  },

  // Route optimization
  optimizeRoute: (tripId) => {
    return apiClient.post(`trips/${tripId}/optimize_route/`);
  },

  // Media operations
  getTripMedia: (tripId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.destination) queryParams.append('destination', params.destination);
    const queryString = queryParams.toString();
    return apiClient.get(`trips/${tripId}/media/${queryString ? `?${queryString}` : ''}`);
  },

  uploadMedia: (tripId, mediaData) => {
    const formData = new FormData();
    for (const key in mediaData) {
      if (mediaData[key] !== null && mediaData[key] !== undefined) {
        formData.append(key, mediaData[key]);
      }
    }
    return apiClient.post(`trips/${tripId}/upload_media/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateMedia: (tripId, mediaId, mediaData) => {
    return apiClient.patch(`trips/${tripId}/media/${mediaId}/`, mediaData);
  },

  deleteMedia: (tripId, mediaId) => {
    return apiClient.delete(`trips/${tripId}/media/${mediaId}/`);
  },

  // Sharing operations
  shareTrip: (tripId, shareData) => {
    return apiClient.post(`trips/${tripId}/share/`, shareData);
  },

  getSharedTrip: (shareToken) => {
    return apiClient.get(`trips/shared/${shareToken}/`);
  },

  getSharedWithMe: () => {
    return apiClient.get('trips/shared-with-me/');
  },

  // Google Maps integration
  searchPlaces: (searchData) => {
    return apiClient.post('trips/search-places/', searchData);
  },

  getPlaceDetails: (placeId) => {
    return apiClient.get(`trips/place-details/${placeId}/`);
  },

  // Statistics
  getTripStats: () => {
    return apiClient.get('trips/my-stats/');
  },

  // Admin operations
  getAllTripsAdmin: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.privacy) queryParams.append('privacy', params.privacy);
    if (params.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();
    return apiClient.get(`trips/admin/trips/${queryString ? `?${queryString}` : ''}`);
  },

  getAllMediaAdmin: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.flagged !== undefined) queryParams.append('flagged', params.flagged);
    if (params.type) queryParams.append('type', params.type);
    if (params.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();
    return apiClient.get(`trips/admin/media/${queryString ? `?${queryString}` : ''}`);
  },

  getMediaDetailsAdmin: (mediaId) => {
    return apiClient.get(`trips/admin/media/${mediaId}/`);
  },

  moderateMedia: (mediaId, moderationData) => {
    return apiClient.post(`trips/admin/media/${mediaId}/moderate/`, moderationData);
  }
};

export default TripService;