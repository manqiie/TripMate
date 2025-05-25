# trips/services.py

import googlemaps
import requests
from django.conf import settings
from typing import List, Dict, Optional, Tuple
import logging
from datetime import datetime, timedelta
import math

logger = logging.getLogger(__name__)

class GoogleMapsService:
    """Service for interacting with Google Maps APIs"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', None)
        if not self.api_key:
            raise ValueError("GOOGLE_MAPS_API_KEY not found in settings")
        
        self.client = googlemaps.Client(key=self.api_key)
    
    def search_places(self, query: str, location: Optional[Dict] = None, 
                     radius: int = 50000, place_type: Optional[str] = None) -> List[Dict]:
        """
        Search for places using Google Places API
        
        Args:
            query: Search query
            location: Center point for search (lat, lng)
            radius: Search radius in meters
            place_type: Type of place to search for
        
        Returns:
            List of place results
        """
        try:
            # Use text search for more flexible queries
            if location:
                location_str = f"{location['lat']},{location['lng']}"
                results = self.client.places(
                    query=query,
                    location=location_str,
                    radius=radius,
                    type=place_type
                )
            else:
                results = self.client.places(query=query, type=place_type)
            
            # Format results
            formatted_results = []
            for place in results.get('results', []):
                formatted_place = {
                    'place_id': place.get('place_id'),
                    'name': place.get('name'),
                    'address': place.get('formatted_address', ''),
                    'latitude': place['geometry']['location']['lat'],
                    'longitude': place['geometry']['location']['lng'],
                    'rating': place.get('rating'),
                    'user_ratings_total': place.get('user_ratings_total'),
                    'types': place.get('types', []),
                    'price_level': place.get('price_level'),
                    'photos': []
                }
                
                # Add photo references
                if place.get('photos'):
                    for photo in place['photos'][:3]:  # Limit to 3 photos
                        photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo['photo_reference']}&key={self.api_key}"
                        formatted_place['photos'].append({
                            'url': photo_url,
                            'width': photo.get('width'),
                            'height': photo.get('height')
                        })
                
                formatted_results.append(formatted_place)
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Google Places search error: {str(e)}")
            raise
    
    def get_place_details(self, place_id: str) -> Dict:
        """
        Get detailed information about a specific place
        
        Args:
            place_id: Google Places ID
        
        Returns:
            Detailed place information
        """
        try:
            fields = [
                'place_id', 'name', 'formatted_address', 'geometry',
                'rating', 'user_ratings_total', 'price_level', 'types',
                'opening_hours', 'phone_number', 'website', 'photos',
                'reviews'
            ]
            
            result = self.client.place(
                place_id=place_id,
                fields=fields
            )
            
            place = result.get('result', {})
            
            formatted_place = {
                'place_id': place.get('place_id'),
                'name': place.get('name'),
                'address': place.get('formatted_address', ''),
                'latitude': place['geometry']['location']['lat'],
                'longitude': place['geometry']['location']['lng'],
                'rating': place.get('rating'),
                'user_ratings_total': place.get('user_ratings_total'),
                'types': place.get('types', []),
                'price_level': place.get('price_level'),
                'phone_number': place.get('formatted_phone_number'),
                'website': place.get('website'),
                'opening_hours': {},
                'photos': [],
                'reviews': []
            }
            
            # Format opening hours
            if place.get('opening_hours'):
                formatted_place['opening_hours'] = {
                    'open_now': place['opening_hours'].get('open_now'),
                    'weekday_text': place['opening_hours'].get('weekday_text', [])
                }
            
            # Add photos
            if place.get('photos'):
                for photo in place['photos'][:5]:  # Limit to 5 photos
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference={photo['photo_reference']}&key={self.api_key}"
                    formatted_place['photos'].append({
                        'url': photo_url,
                        'width': photo.get('width'),
                        'height': photo.get('height')
                    })
            
            # Add reviews
            if place.get('reviews'):
                for review in place['reviews'][:3]:  # Limit to 3 reviews
                    formatted_place['reviews'].append({
                        'author_name': review.get('author_name'),
                        'rating': review.get('rating'),
                        'text': review.get('text'),
                        'time': review.get('time')
                    })
            
            return formatted_place
            
        except Exception as e:
            logger.error(f"Google Place details error: {str(e)}")
            raise
    
    def get_distance_matrix(self, origins: List[Tuple[float, float]], 
                          destinations: List[Tuple[float, float]],
                          mode: str = 'driving') -> Dict:
        """
        Get distance and duration between multiple origins and destinations
        
        Args:
            origins: List of (lat, lng) tuples
            destinations: List of (lat, lng) tuples
            mode: Travel mode (driving, walking, transit, bicycling)
        
        Returns:
            Distance matrix results
        """
        try:
            result = self.client.distance_matrix(
                origins=origins,
                destinations=destinations,
                mode=mode,
                units='metric',
                avoid=['tolls']  # Avoid tolls by default
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Distance matrix error: {str(e)}")
            raise
    
    def get_directions(self, origin: Tuple[float, float], 
                      destination: Tuple[float, float],
                      waypoints: Optional[List[Tuple[float, float]]] = None,
                      optimize_waypoints: bool = True,
                      mode: str = 'driving') -> Dict:
        """
        Get directions between points with optional waypoints
        
        Args:
            origin: Starting point (lat, lng)
            destination: End point (lat, lng)
            waypoints: Optional intermediate points
            optimize_waypoints: Whether to optimize waypoint order
            mode: Travel mode
        
        Returns:
            Directions result
        """
        try:
            result = self.client.directions(
                origin=origin,
                destination=destination,
                waypoints=waypoints,
                optimize_waypoints=optimize_waypoints,
                mode=mode,
                units='metric',
                avoid=['tolls']
            )
            
            return result[0] if result else {}
            
        except Exception as e:
            logger.error(f"Directions error: {str(e)}")
            raise

class RouteOptimizer:
    """Service for optimizing travel routes"""
    
    def __init__(self):
        self.maps_service = GoogleMapsService()
    
    def optimize_trip_route(self, trip) -> Dict:
        """
        Optimize the route for a trip's destinations
        
        Args:
            trip: Trip model instance
        
        Returns:
            Optimization result with route data
        """
        try:
            destinations = list(trip.destinations.all().order_by('order_index'))
            
            if len(destinations) < 2:
                return {
                    'success': False,
                    'error': 'At least 2 destinations required for route optimization'
                }
            
            # Convert destinations to coordinates
            waypoints = [(dest.latitude, dest.longitude) for dest in destinations]
            
            if len(waypoints) == 2:
                # Simple case: just get directions between two points
                return self._optimize_two_points(destinations, waypoints)
            else:
                # Complex case: optimize multiple waypoints
                return self._optimize_multiple_points(destinations, waypoints)
                
        except Exception as e:
            logger.error(f"Route optimization error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _optimize_two_points(self, destinations: List, waypoints: List[Tuple[float, float]]) -> Dict:
        """Optimize route between two points"""
        try:
            directions = self.maps_service.get_directions(
                origin=waypoints[0],
                destination=waypoints[1]
            )
            
            if not directions:
                return {
                    'success': False,
                    'error': 'Could not find route between destinations'
                }
            
            # Extract route information
            route = directions['routes'][0] if directions.get('routes') else {}
            leg = route['legs'][0] if route.get('legs') else {}
            
            total_distance = leg.get('distance', {}).get('value', 0) / 1000  # Convert to km
            total_duration = leg.get('duration', {}).get('value', 0) / 60  # Convert to minutes
            
            return {
                'success': True,
                'route_data': directions,
                'total_distance': total_distance,
                'total_duration': total_duration,
                'destination_order': [dest.id for dest in destinations]
            }
            
        except Exception as e:
            logger.error(f"Two-point optimization error: {str(e)}")
            raise
    
    def _optimize_multiple_points(self, destinations: List, waypoints: List[Tuple[float, float]]) -> Dict:
        """Optimize route for multiple points using TSP-like approach"""
        try:
            # For Google Maps, we'll use the built-in waypoint optimization
            # Use first point as origin and last as destination
            origin = waypoints[0]
            destination = waypoints[-1]
            intermediate_waypoints = waypoints[1:-1] if len(waypoints) > 2 else None
            
            directions = self.maps_service.get_directions(
                origin=origin,
                destination=destination,
                waypoints=intermediate_waypoints,
                optimize_waypoints=True
            )
            
            if not directions:
                return {
                    'success': False,
                    'error': 'Could not find optimized route'
                }
            
            # Extract optimized waypoint order
            waypoint_order = directions.get('waypoint_order', [])
            
            # Calculate new destination order
            optimized_destinations = [destinations[0]]  # Start with origin
            
            # Add intermediate destinations in optimized order
            if waypoint_order and len(destinations) > 2:
                for idx in waypoint_order:
                    optimized_destinations.append(destinations[idx + 1])  # +1 because waypoint_order is 0-indexed relative to intermediate points
            
            # Add final destination
            if len(destinations) > 1:
                optimized_destinations.append(destinations[-1])
            
            # Calculate total distance and duration
            total_distance = 0
            total_duration = 0
            
            route = directions['routes'][0] if directions.get('routes') else {}
            for leg in route.get('legs', []):
                total_distance += leg.get('distance', {}).get('value', 0)
                total_duration += leg.get('duration', {}).get('value', 0)
            
            total_distance = total_distance / 1000  # Convert to km
            total_duration = total_duration / 60  # Convert to minutes
            
            return {
                'success': True,
                'route_data': directions,
                'total_distance': total_distance,
                'total_duration': total_duration,
                'destination_order': [dest.id for dest in optimized_destinations]
            }
            
        except Exception as e:
            logger.error(f"Multi-point optimization error: {str(e)}")
            raise
    
    def calculate_trip_metrics(self, destinations: List) -> Dict:
        """
        Calculate various metrics for a trip
        
        Args:
            destinations: List of TripDestination objects
        
        Returns:
            Dictionary with trip metrics
        """
        if len(destinations) < 2:
            return {
                'total_destinations': len(destinations),
                'total_distance': 0,
                'estimated_duration': 0,
                'bounding_box': None
            }
        
        # Calculate bounding box
        lats = [dest.latitude for dest in destinations]
        lngs = [dest.longitude for dest in destinations]
        
        bounding_box = {
            'north': max(lats),
            'south': min(lats),
            'east': max(lngs),
            'west': min(lngs)
        }
        
        # Calculate center point
        center = {
            'lat': sum(lats) / len(lats),
            'lng': sum(lngs) / len(lngs)
        }
        
        try:
            # Get distance matrix for all points
            coords = [(dest.latitude, dest.longitude) for dest in destinations]
            matrix = self.maps_service.get_distance_matrix(coords, coords)
            
            # Calculate total distance if visiting all destinations in order
            total_distance = 0
            for i in range(len(destinations) - 1):
                distance_info = matrix['rows'][i]['elements'][i + 1]
                if distance_info['status'] == 'OK':
                    total_distance += distance_info['distance']['value']
            
            total_distance = total_distance / 1000  # Convert to km
            
            return {
                'total_destinations': len(destinations),
                'total_distance': total_distance,
                'bounding_box': bounding_box,
                'center': center
            }
            
        except Exception as e:
            logger.error(f"Trip metrics calculation error: {str(e)}")
            return {
                'total_destinations': len(destinations),
                'total_distance': 0,
                'bounding_box': bounding_box,
                'center': center
            }

class TravelTimeEstimator:
    """Service for estimating travel times and suggesting visit durations"""
    
    @staticmethod
    def estimate_visit_duration(place_types: List[str]) -> int:
        """
        Estimate how long to spend at a place based on its type
        
        Args:
            place_types: List of Google Places types
        
        Returns:
            Estimated duration in minutes
        """
        type_durations = {
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
            'casino': 180,
            'night_club': 180,
            'spa': 120,
            'gym': 90,
            'movie_theater': 150,
        }
        
        # Find the most specific type and return its duration
        for place_type in place_types:
            if place_type in type_durations:
                return type_durations[place_type]
        
        # Default duration if no specific type found
        return 60
    
    @staticmethod
    def suggest_best_visit_times(place_types: List[str]) -> List[str]:
        """
        Suggest best times to visit based on place type
        
        Args:
            place_types: List of Google Places types
        
        Returns:
            List of suggested time periods
        """
        morning_types = ['church', 'park', 'zoo', 'museum']
        afternoon_types = ['shopping_mall', 'tourist_attraction', 'art_gallery']
        evening_types = ['restaurant', 'night_club', 'casino', 'bar']
        
        suggestions = []
        
        for place_type in place_types:
            if place_type in morning_types:
                suggestions.append('Morning (9AM-12PM)')
            elif place_type in afternoon_types:
                suggestions.append('Afternoon (1PM-5PM)')
            elif place_type in evening_types:
                suggestions.append('Evening (6PM-10PM)')
        
        return list(set(suggestions)) if suggestions else ['Anytime']