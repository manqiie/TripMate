# trips/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Trip, TripDestination, TripMedia, TripItinerary, TripItineraryItem, TripShare
import requests
from django.conf import settings

class TripDestinationSerializer(serializers.ModelSerializer):
    media_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TripDestination
        fields = [
            'id', 'name', 'address', 'latitude', 'longitude', 'place_id',
            'notes', 'visit_date', 'visit_time', 'duration_minutes',
            'order_index', 'media_count', 'created_at', 'updated_at'
        ]
    
    def get_media_count(self, obj):
        return obj.media.count()

class TripMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    file_size_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = TripMedia
        fields = [
            'id', 'file', 'file_url', 'media_type', 'title', 'description',
            'file_size', 'file_size_formatted', 'latitude', 'longitude',
            'captured_at', 'is_flagged', 'flag_reason', 'destination',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['media_type', 'file_size', 'is_flagged', 'flag_reason']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_file_size_formatted(self, obj):
        if obj.file_size:
            # Convert bytes to human readable format
            for unit in ['B', 'KB', 'MB', 'GB']:
                if obj.file_size < 1024.0:
                    return f"{obj.file_size:.1f} {unit}"
                obj.file_size /= 1024.0
            return f"{obj.file_size:.1f} TB"
        return None

class TripItineraryItemSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    
    class Meta:
        model = TripItineraryItem
        fields = [
            'id', 'time', 'title', 'description', 'duration_minutes',
            'order_index', 'destination', 'destination_name'
        ]

class TripItinerarySerializer(serializers.ModelSerializer):
    items = TripItineraryItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = TripItinerary
        fields = [
            'id', 'day_number', 'date', 'title', 'description',
            'items', 'created_at', 'updated_at'
        ]

class TripShareSerializer(serializers.ModelSerializer):
    shared_with_username = serializers.CharField(source='shared_with.username', read_only=True)
    shared_with_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TripShare
        fields = [
            'id', 'shared_with', 'shared_with_username', 'shared_with_name',
            'can_edit', 'created_at'
        ]
    
    def get_shared_with_name(self, obj):
        return f"{obj.shared_with.first_name} {obj.shared_with.last_name}".strip()

class TripSerializer(serializers.ModelSerializer):
    destinations = TripDestinationSerializer(many=True, read_only=True)
    media = TripMediaSerializer(many=True, read_only=True)
    itinerary = TripItinerarySerializer(many=True, read_only=True)
    shares = TripShareSerializer(many=True, read_only=True)
    
    user_name = serializers.SerializerMethodField()
    destinations_count = serializers.SerializerMethodField()
    media_count = serializers.SerializerMethodField()
    share_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Trip
        fields = [
            'id', 'title', 'description', 'start_date', 'end_date',
            'status', 'privacy', 'share_token', 'optimized_route',
            'total_distance', 'total_duration', 'duration_days',
            'user', 'user_name', 'destinations', 'media', 'itinerary', 'shares',
            'destinations_count', 'media_count', 'share_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'share_token', 'optimized_route', 'total_distance', 'total_duration']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
    
    def get_destinations_count(self, obj):
        return obj.destinations.count()
    
    def get_media_count(self, obj):
        return obj.media.count()
    
    def get_share_url(self, obj):
        if obj.is_shared:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/trips/shared/{obj.share_token}/')
        return None

class TripCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating trips"""
    
    class Meta:
        model = Trip
        fields = [
            'title', 'description', 'start_date', 'end_date',
            'status', 'privacy'
        ]

class RouteOptimizationSerializer(serializers.Serializer):
    """Serializer for route optimization request"""
    trip_id = serializers.IntegerField()
    origin = serializers.DictField(required=False)  # {lat, lng, address}
    destination = serializers.DictField(required=False)  # {lat, lng, address}
    waypoints = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )  # [{lat, lng, address, place_id}]
    
    def validate_trip_id(self, value):
        request = self.context.get('request')
        if request:
            try:
                trip = Trip.objects.get(id=value, user=request.user)
                return value
            except Trip.DoesNotExist:
                raise serializers.ValidationError("Trip not found or access denied.")
        raise serializers.ValidationError("Authentication required.")

class GooglePlacesSearchSerializer(serializers.Serializer):
    """Serializer for Google Places search"""
    query = serializers.CharField(max_length=255)
    location = serializers.DictField(required=False)  # {lat, lng}
    radius = serializers.IntegerField(default=50000, min_value=1, max_value=50000)  # meters
    type = serializers.CharField(required=False)  # place type filter

class AddDestinationSerializer(serializers.ModelSerializer):
    """Serializer for adding destinations to a trip"""
    
    class Meta:
        model = TripDestination
        fields = [
            'name', 'address', 'latitude', 'longitude', 'place_id',
            'notes', 'visit_date', 'visit_time', 'duration_minutes'
        ]
    
    def create(self, validated_data):
        trip = self.context.get('trip')
        validated_data['trip'] = trip
        
        # Set order_index as the last destination
        last_destination = TripDestination.objects.filter(trip=trip).order_by('-order_index').first()
        validated_data['order_index'] = (last_destination.order_index + 1) if last_destination else 0
        
        return super().create(validated_data)

class BulkAddDestinationsSerializer(serializers.Serializer):
    """Serializer for adding multiple destinations at once"""
    destinations = AddDestinationSerializer(many=True)
    
    def create(self, validated_data):
        trip = self.context.get('trip')
        destinations_data = validated_data['destinations']
        
        # Get the starting order index
        last_destination = TripDestination.objects.filter(trip=trip).order_by('-order_index').first()
        start_index = (last_destination.order_index + 1) if last_destination else 0
        
        # Create destinations
        destinations = []
        for i, dest_data in enumerate(destinations_data):
            dest_data['trip'] = trip
            dest_data['order_index'] = start_index + i
            destination = TripDestination.objects.create(**dest_data)
            destinations.append(destination)
        
        return destinations

class TripMediaUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading media to trips"""
    
    class Meta:
        model = TripMedia
        fields = [
            'file', 'title', 'description', 'latitude', 'longitude',
            'captured_at', 'destination'
        ]
    
    def create(self, validated_data):
        trip = self.context.get('trip')
        validated_data['trip'] = trip
        return super().create(validated_data)

# Admin serializers for moderation
class AdminTripMediaSerializer(TripMediaSerializer):
    """Extended serializer for admin media moderation"""
    trip_title = serializers.CharField(source='trip.title', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta(TripMediaSerializer.Meta):
        fields = TripMediaSerializer.Meta.fields + [
            'trip_title', 'user_name', 'flagged_by', 'flagged_at'
        ]
    
    def get_user_name(self, obj):
        return f"{obj.trip.user.first_name} {obj.trip.user.last_name}".strip() or obj.trip.user.username

class MediaModerationSerializer(serializers.Serializer):
    """Serializer for media moderation actions"""
    action = serializers.ChoiceField(choices=['flag', 'unflag', 'delete'])
    reason = serializers.CharField(required=False, max_length=200)
    
    def validate(self, attrs):
        if attrs['action'] == 'flag' and not attrs.get('reason'):
            raise serializers.ValidationError({'reason': 'Reason is required when flagging content.'})
        return attrs