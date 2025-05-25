# trips/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
import os

def trip_media_upload_path(instance, filename):
    """Generate upload path for trip media files"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('trips', str(instance.trip.id), 'media', filename)

class Trip(models.Model):
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIVACY_CHOICES = [
        ('private', 'Private'),
        ('public', 'Public'),
        ('shared', 'Shared with Link'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    privacy = models.CharField(max_length=20, choices=PRIVACY_CHOICES, default='private')
    share_token = models.UUIDField(default=uuid.uuid4, unique=True)
    
    # Google Maps data
    optimized_route = models.JSONField(null=True, blank=True)  # Store optimized route data
    total_distance = models.FloatField(null=True, blank=True)  # in kilometers
    total_duration = models.IntegerField(null=True, blank=True)  # in minutes
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    @property
    def duration_days(self):
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days + 1
        return None
    
    @property
    def is_shared(self):
        return self.privacy in ['public', 'shared']

class TripDestination(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='destinations')
    name = models.CharField(max_length=200)
    address = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    place_id = models.CharField(max_length=200, blank=True)  # Google Places ID
    
    # Additional details
    notes = models.TextField(blank=True)
    visit_date = models.DateField(null=True, blank=True)
    visit_time = models.TimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)  # How long to stay
    
    # Route optimization
    order_index = models.IntegerField(default=0)  # Order in optimized route
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order_index', 'created_at']
    
    def __str__(self):
        return f"{self.name} - {self.trip.title}"

class TripMedia(models.Model):
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('document', 'Document'),
    ]
    
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='media')
    destination = models.ForeignKey(TripDestination, on_delete=models.CASCADE, related_name='media', null=True, blank=True)
    
    file = models.FileField(upload_to=trip_media_upload_path)
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPES)
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    
    # Metadata
    file_size = models.BigIntegerField(null=True, blank=True)  # in bytes
    latitude = models.FloatField(null=True, blank=True)  # GPS coordinates
    longitude = models.FloatField(null=True, blank=True)
    captured_at = models.DateTimeField(null=True, blank=True)  # When photo/video was taken
    
    # Moderation
    is_flagged = models.BooleanField(default=False)
    flag_reason = models.CharField(max_length=200, blank=True)
    flagged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='flagged_media')
    flagged_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-captured_at', '-created_at']
    
    def __str__(self):
        return f"{self.title or self.file.name} - {self.trip.title}"
    
    @property
    def file_extension(self):
        return os.path.splitext(self.file.name)[1].lower()
    
    @property
    def is_image(self):
        return self.media_type == 'image' or self.file_extension in ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    
    @property
    def is_video(self):
        return self.media_type == 'video' or self.file_extension in ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    
    def save(self, *args, **kwargs):
        # Auto-detect media type based on file extension
        if not self.media_type:
            ext = self.file_extension
            if ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                self.media_type = 'image'
            elif ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm']:
                self.media_type = 'video'
            elif ext in ['.mp3', '.wav', '.ogg', '.aac']:
                self.media_type = 'audio'
            else:
                self.media_type = 'document'
        
        # Set file size
        if self.file and not self.file_size:
            self.file_size = self.file.size
        
        super().save(*args, **kwargs)

class TripItinerary(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='itinerary')
    day_number = models.IntegerField()
    date = models.DateField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['day_number']
        unique_together = ['trip', 'day_number']
    
    def __str__(self):
        return f"Day {self.day_number} - {self.trip.title}"

class TripItineraryItem(models.Model):
    itinerary = models.ForeignKey(TripItinerary, on_delete=models.CASCADE, related_name='items')
    destination = models.ForeignKey(TripDestination, on_delete=models.CASCADE, null=True, blank=True)
    
    time = models.TimeField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    
    order_index = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['time', 'order_index']
    
    def __str__(self):
        return f"{self.time} - {self.title}"

class TripShare(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='shares')
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_trips')
    can_edit = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['trip', 'shared_with']
    
    def __str__(self):
        return f"{self.trip.title} shared with {self.shared_with.username}"