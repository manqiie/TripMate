# trips/signals.py

from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from .models import Trip, TripMedia
import os

@receiver(pre_delete, sender=TripMedia)
def delete_media_file(sender, instance, **kwargs):
    """
    Delete the actual media file when a TripMedia object is deleted
    """
    if instance.file:
        if os.path.isfile(instance.file.path):
            try:
                os.remove(instance.file.path)
            except OSError:
                pass  # File might already be deleted

@receiver(post_save, sender=Trip)
def create_trip_directory(sender, instance, created, **kwargs):
    """
    Create a directory for the trip when it's created
    """
    if created:
        from django.conf import settings
        trip_dir = os.path.join(settings.MEDIA_ROOT, 'trips', str(instance.id))
        os.makedirs(os.path.join(trip_dir, 'media'), exist_ok=True)

@receiver(pre_delete, sender=Trip)
def cleanup_trip_directory(sender, instance, **kwargs):
    """
    Clean up trip directory when trip is deleted
    """
    from django.conf import settings
    import shutil
    
    trip_dir = os.path.join(settings.MEDIA_ROOT, 'trips', str(instance.id))
    if os.path.exists(trip_dir):
        try:
            shutil.rmtree(trip_dir)
        except OSError:
            pass  # Directory might not exist or be inaccessible