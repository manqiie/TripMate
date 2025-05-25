# trips/views.py

from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.contrib.auth.models import User
from django.utils import timezone

from .models import Trip, TripDestination, TripMedia, TripItinerary, TripItineraryItem, TripShare
from .serializers import (
    TripSerializer, TripCreateSerializer, TripDestinationSerializer,
    TripMediaSerializer, TripMediaUploadSerializer, RouteOptimizationSerializer,
    GooglePlacesSearchSerializer, AddDestinationSerializer, BulkAddDestinationsSerializer,
    AdminTripMediaSerializer, MediaModerationSerializer
)
from .services import GoogleMapsService, RouteOptimizer
from accounts.permissions import IsOwnerOrAdmin, IsAdmin

import json
import logging

logger = logging.getLogger(__name__)

class TripViewSet(viewsets.ModelViewSet):
    """ViewSet for Trip CRUD operations"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Trip.objects.filter(user=user)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Search by title
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TripCreateSerializer
        return TripSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_destination(self, request, pk=None):
        """Add a destination to the trip"""
        trip = self.get_object()
        serializer = AddDestinationSerializer(data=request.data, context={'trip': trip})
        
        if serializer.is_valid():
            destination = serializer.save()
            return Response(TripDestinationSerializer(destination).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_destinations_bulk(self, request, pk=None):
        """Add multiple destinations to the trip"""
        trip = self.get_object()
        serializer = BulkAddDestinationsSerializer(data=request.data, context={'trip': trip})
        
        if serializer.is_valid():
            destinations = serializer.save()
            return Response(
                TripDestinationSerializer(destinations, many=True).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def optimize_route(self, request, pk=None):
        """Optimize the route for the trip using Google Maps"""
        trip = self.get_object()
        
        try:
            optimizer = RouteOptimizer()
            result = optimizer.optimize_trip_route(trip)
            
            if result['success']:
                # Update the trip with optimized route
                trip.optimized_route = result['route_data']
                trip.total_distance = result.get('total_distance')
                trip.total_duration = result.get('total_duration')
                trip.save()
                
                # Update destination order
                for i, dest_id in enumerate(result['destination_order']):
                    TripDestination.objects.filter(id=dest_id).update(order_index=i)
                
                return Response({
                    'success': True,
                    'message': 'Route optimized successfully',
                    'route_data': result['route_data'],
                    'total_distance': result.get('total_distance'),
                    'total_duration': result.get('total_duration')
                })
            else:
                return Response({
                    'success': False,
                    'error': result.get('error', 'Failed to optimize route')
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Route optimization error: {str(e)}")
            return Response({
                'success': False,
                'error': 'An error occurred while optimizing the route'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_media(self, request, pk=None):
        """Upload media files to the trip"""
        trip = self.get_object()
        serializer = TripMediaUploadSerializer(data=request.data, context={'trip': trip})
        
        if serializer.is_valid():
            media = serializer.save()
            return Response(TripMediaSerializer(media, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def media(self, request, pk=None):
        """Get all media for the trip"""
        trip = self.get_object()
        media = trip.media.filter(is_flagged=False).order_by('-captured_at', '-created_at')
        
        # Filter by destination if specified
        destination_id = request.query_params.get('destination')
        if destination_id:
            media = media.filter(destination_id=destination_id)
        
        serializer = TripMediaSerializer(media, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share trip with another user"""
        trip = self.get_object()
        username = request.data.get('username')
        can_edit = request.data.get('can_edit', False)
        
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_to_share_with = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if user_to_share_with == request.user:
            return Response({'error': 'Cannot share with yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already shared
        existing_share = TripShare.objects.filter(trip=trip, shared_with=user_to_share_with).first()
        if existing_share:
            existing_share.can_edit = can_edit
            existing_share.save()
            return Response({'message': 'Share permissions updated'})
        
        # Create new share
        trip_share = TripShare.objects.create(
            trip=trip,
            shared_with=user_to_share_with,
            can_edit=can_edit
        )
        
        return Response({'message': f'Trip shared with {username}'})
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a trip"""
        original_trip = self.get_object()
        
        # Create a copy of the trip
        new_trip = Trip.objects.create(
            user=request.user,
            title=f"{original_trip.title} (Copy)",
            description=original_trip.description,
            status='planning',
            privacy='private'
        )
        
        # Copy destinations
        for destination in original_trip.destinations.all():
            TripDestination.objects.create(
                trip=new_trip,
                name=destination.name,
                address=destination.address,
                latitude=destination.latitude,
                longitude=destination.longitude,
                place_id=destination.place_id,
                notes=destination.notes,
                duration_minutes=destination.duration_minutes,
                order_index=destination.order_index
            )
        
        serializer = TripSerializer(new_trip, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class TripDestinationViewSet(viewsets.ModelViewSet):
    """ViewSet for TripDestination CRUD operations"""
    serializer_class = TripDestinationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        trip_id = self.kwargs.get('trip_pk')
        return TripDestination.objects.filter(
            trip_id=trip_id,
            trip__user=self.request.user
        ).order_by('order_index')
    
    def perform_create(self, serializer):
        trip_id = self.kwargs.get('trip_pk')
        trip = get_object_or_404(Trip, id=trip_id, user=self.request.user)
        
        # Set order_index
        last_destination = TripDestination.objects.filter(trip=trip).order_by('-order_index').first()
        order_index = (last_destination.order_index + 1) if last_destination else 0
        
        serializer.save(trip=trip, order_index=order_index)
    
    @action(detail=False, methods=['post'])
    def reorder(self, request, trip_pk=None):
        """Reorder destinations"""
        trip = get_object_or_404(Trip, id=trip_pk, user=request.user)
        destination_ids = request.data.get('destination_ids', [])
        
        if not destination_ids:
            return Response({'error': 'Destination IDs required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update order for each destination
        for index, dest_id in enumerate(destination_ids):
            TripDestination.objects.filter(
                id=dest_id,
                trip=trip
            ).update(order_index=index)
        
        return Response({'message': 'Destinations reordered successfully'})

class TripMediaViewSet(viewsets.ModelViewSet):
    """ViewSet for TripMedia CRUD operations"""
    serializer_class = TripMediaSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        trip_id = self.kwargs.get('trip_pk')
        queryset = TripMedia.objects.filter(
            trip_id=trip_id,
            trip__user=self.request.user,
            is_flagged=False
        ).order_by('-captured_at', '-created_at')
        
        # Filter by media type
        media_type = self.request.query_params.get('type')
        if media_type:
            queryset = queryset.filter(media_type=media_type)
        
        # Filter by destination
        destination_id = self.request.query_params.get('destination')
        if destination_id:
            queryset = queryset.filter(destination_id=destination_id)
        
        return queryset
    
    def perform_create(self, serializer):
        trip_id = self.kwargs.get('trip_pk')
        trip = get_object_or_404(Trip, id=trip_id, user=self.request.user)
        serializer.save(trip=trip)

class GooglePlacesSearchView(APIView):
    """Search for places using Google Places API"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = GooglePlacesSearchSerializer(data=request.data)
        if serializer.is_valid():
            try:
                maps_service = GoogleMapsService()
                results = maps_service.search_places(
                    query=serializer.validated_data['query'],
                    location=serializer.validated_data.get('location'),
                    radius=serializer.validated_data.get('radius', 50000),
                    place_type=serializer.validated_data.get('type')
                )
                return Response(results)
            except Exception as e:
                logger.error(f"Google Places search error: {str(e)}")
                return Response({
                    'error': 'Failed to search places'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PlaceDetailsView(APIView):
    """Get detailed information about a place"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, place_id):
        try:
            maps_service = GoogleMapsService()
            details = maps_service.get_place_details(place_id)
            return Response(details)
        except Exception as e:
            logger.error(f"Place details error: {str(e)}")
            return Response({
                'error': 'Failed to fetch place details'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SharedTripView(APIView):
    """View shared trips via share token"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, share_token):
        try:
            trip = Trip.objects.get(share_token=share_token)
            
            # Check if trip is actually shared
            if trip.privacy == 'private':
                return Response({
                    'error': 'This trip is not publicly shared'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = TripSerializer(trip, context={'request': request})
            return Response(serializer.data)
            
        except Trip.DoesNotExist:
            return Response({
                'error': 'Trip not found'
            }, status=status.HTTP_404_NOT_FOUND)

class TripStatsView(APIView):
    """Get user's trip statistics"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        trips = Trip.objects.filter(user=user)
        
        stats = {
            'total_trips': trips.count(),
            'completed_trips': trips.filter(status='completed').count(),
            'upcoming_trips': trips.filter(status='upcoming').count(),
            'planning_trips': trips.filter(status='planning').count(),
            'total_destinations': TripDestination.objects.filter(trip__user=user).count(),
            'total_media': TripMedia.objects.filter(trip__user=user, is_flagged=False).count(),
            'shared_trips': trips.filter(privacy__in=['public', 'shared']).count(),
        }
        
        # Calculate total distance and duration
        completed_trips = trips.filter(status='completed', total_distance__isnull=False)
        stats['total_distance_km'] = sum(trip.total_distance or 0 for trip in completed_trips)
        stats['total_duration_minutes'] = sum(trip.total_duration or 0 for trip in completed_trips)
        
        return Response(stats)

# Admin Views for Content Moderation

class AdminTripMediaListView(generics.ListAPIView):
    """Admin view to list all media for moderation"""
    serializer_class = AdminTripMediaSerializer
    permission_classes = [IsAdmin]
    
    def get_queryset(self):
        queryset = TripMedia.objects.all().order_by('-created_at')
        
        # Filter by flagged status
        flagged = self.request.query_params.get('flagged')
        if flagged == 'true':
            queryset = queryset.filter(is_flagged=True)
        elif flagged == 'false':
            queryset = queryset.filter(is_flagged=False)
        
        # Filter by media type
        media_type = self.request.query_params.get('type')
        if media_type:
            queryset = queryset.filter(media_type=media_type)
        
        # Search by trip title or user
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(trip__title__icontains=search) |
                Q(trip__user__username__icontains=search) |
                Q(trip__user__first_name__icontains=search) |
                Q(trip__user__last_name__icontains=search)
            )
        
        return queryset

class AdminTripMediaDetailView(generics.RetrieveAPIView):
    """Admin view to get detailed media information"""
    queryset = TripMedia.objects.all()
    serializer_class = AdminTripMediaSerializer
    permission_classes = [IsAdmin]

class AdminMediaModerationView(APIView):
    """Admin view for media moderation actions"""
    permission_classes = [IsAdmin]
    
    def post(self, request, media_id):
        try:
            media = TripMedia.objects.get(id=media_id)
        except TripMedia.DoesNotExist:
            return Response({'error': 'Media not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MediaModerationSerializer(data=request.data)
        if serializer.is_valid():
            action = serializer.validated_data['action']
            reason = serializer.validated_data.get('reason', '')
            
            if action == 'flag':
                media.is_flagged = True
                media.flag_reason = reason
                media.flagged_by = request.user
                media.flagged_at = timezone.now()
                media.save()
                
                return Response({'message': 'Media flagged successfully'})
            
            elif action == 'unflag':
                media.is_flagged = False
                media.flag_reason = ''
                media.flagged_by = None
                media.flagged_at = None
                media.save()
                
                return Response({'message': 'Media unflagged successfully'})
            
            elif action == 'delete':
                media.delete()
                return Response({'message': 'Media deleted successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminTripListView(generics.ListAPIView):
    """Admin view to list all trips"""
    serializer_class = TripSerializer
    permission_classes = [IsAdmin]
    
    def get_queryset(self):
        queryset = Trip.objects.all().order_by('-created_at')
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by privacy
        privacy = self.request.query_params.get('privacy')
        if privacy:
            queryset = queryset.filter(privacy=privacy)
        
        # Search by title or user
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(user__username__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search)
            )
        
        return queryset

class MySharedTripsView(generics.ListAPIView):
    """View trips shared with the current user"""
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Get trips shared with the current user
        shared_trip_ids = TripShare.objects.filter(
            shared_with=self.request.user
        ).values_list('trip_id', flat=True)
        
        return Trip.objects.filter(id__in=shared_trip_ids).order_by('-created_at')