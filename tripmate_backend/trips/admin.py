# trips/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import Trip, TripDestination, TripMedia, TripItinerary, TripItineraryItem, TripShare

class TripDestinationInline(admin.TabularInline):
    model = TripDestination
    extra = 0
    fields = ('name', 'address', 'visit_date', 'order_index')
    readonly_fields = ('latitude', 'longitude', 'place_id')

class TripMediaInline(admin.TabularInline):
    model = TripMedia
    extra = 0
    fields = ('file', 'media_type', 'title', 'is_flagged')
    readonly_fields = ('file_size', 'captured_at')

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'status', 'privacy', 'start_date', 'end_date', 'destinations_count', 'media_count', 'created_at')
    list_filter = ('status', 'privacy', 'created_at', 'start_date')
    search_fields = ('title', 'description', 'user__username', 'user__email')
    readonly_fields = ('share_token', 'total_distance', 'total_duration', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'description', 'status', 'privacy')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date')
        }),
        ('Route Information', {
            'fields': ('total_distance', 'total_duration', 'optimized_route'),
            'classes': ('collapse',)
        }),
        ('Sharing', {
            'fields': ('share_token',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    inlines = [TripDestinationInline, TripMediaInline]
    
    def destinations_count(self, obj):
        return obj.destinations.count()
    destinations_count.short_description = 'Destinations'
    
    def media_count(self, obj):
        return obj.media.count()
    media_count.short_description = 'Media Files'

@admin.register(TripDestination)
class TripDestinationAdmin(admin.ModelAdmin):
    list_display = ('name', 'trip', 'address', 'visit_date', 'order_index', 'media_count')
    list_filter = ('visit_date', 'created_at')
    search_fields = ('name', 'address', 'trip__title')
    readonly_fields = ('latitude', 'longitude', 'place_id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('trip', 'name', 'address', 'notes')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude', 'place_id')
        }),
        ('Visit Details', {
            'fields': ('visit_date', 'visit_time', 'duration_minutes', 'order_index')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def media_count(self, obj):
        return obj.media.count()
    media_count.short_description = 'Media'

@admin.register(TripMedia)
class TripMediaAdmin(admin.ModelAdmin):
    list_display = ('title', 'trip', 'media_type', 'file_preview', 'file_size_display', 'is_flagged', 'created_at')
    list_filter = ('media_type', 'is_flagged', 'created_at', 'captured_at')
    search_fields = ('title', 'description', 'trip__title', 'trip__user__username')
    readonly_fields = ('file_size', 'media_type', 'file_preview', 'captured_at', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('trip', 'destination', 'file', 'file_preview', 'media_type', 'file_size')
        }),
        ('Content', {
            'fields': ('title', 'description')
        }),
        ('Location & Time', {
            'fields': ('latitude', 'longitude', 'captured_at')
        }),
        ('Moderation', {
            'fields': ('is_flagged', 'flag_reason', 'flagged_by', 'flagged_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def file_preview(self, obj):
        if obj.is_image and obj.file:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 200px;" />',
                obj.file.url
            )
        elif obj.is_video and obj.file:
            return format_html(
                '<video width="200" height="150" controls><source src="{}" type="video/mp4"></video>',
                obj.file.url
            )
        elif obj.file:
            return format_html(
                '<a href="{}" target="_blank">View File</a>',
                obj.file.url
            )
        return "No file"
    file_preview.short_description = 'Preview'
    file_preview.allow_tags = True
    
    def file_size_display(self, obj):
        if obj.file_size:
            size = obj.file_size
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024.0:
                    return f"{size:.1f} {unit}"
                size /= 1024.0
            return f"{size:.1f} TB"
        return "Unknown"
    file_size_display.short_description = 'File Size'
    
    actions = ['flag_media', 'unflag_media', 'delete_flagged_media']
    
    def flag_media(self, request, queryset):
        updated = queryset.update(is_flagged=True, flagged_by=request.user)
        self.message_user(request, f'{updated} media files were flagged.')
    flag_media.short_description = "Flag selected media"
    
    def unflag_media(self, request, queryset):
        updated = queryset.update(is_flagged=False, flagged_by=None, flag_reason='', flagged_at=None)
        self.message_user(request, f'{updated} media files were unflagged.')
    unflag_media.short_description = "Unflag selected media"
    
    def delete_flagged_media(self, request, queryset):
        flagged_queryset = queryset.filter(is_flagged=True)
        count = flagged_queryset.count()
        flagged_queryset.delete()
        self.message_user(request, f'{count} flagged media files were deleted.')
    delete_flagged_media.short_description = "Delete flagged media"

@admin.register(TripItinerary)
class TripItineraryAdmin(admin.ModelAdmin):
    list_display = ('trip', 'day_number', 'date', 'title', 'items_count')
    list_filter = ('date', 'created_at')
    search_fields = ('title', 'description', 'trip__title')
    
    def items_count(self, obj):
        return obj.items.count()
    items_count.short_description = 'Items'

@admin.register(TripItineraryItem)
class TripItineraryItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'itinerary', 'time', 'duration_minutes', 'order_index')
    list_filter = ('time', 'created_at')
    search_fields = ('title', 'description', 'itinerary__trip__title')

@admin.register(TripShare)
class TripShareAdmin(admin.ModelAdmin):
    list_display = ('trip', 'shared_with', 'can_edit', 'created_at')
    list_filter = ('can_edit', 'created_at')
    search_fields = ('trip__title', 'shared_with__username', 'shared_with__email')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('trip', 'shared_with')