# trips/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from . import views

# Main router
router = DefaultRouter()
router.register(r'trips', views.TripViewSet, basename='trip')

# Nested routers for trip-related resources
trips_router = routers.NestedDefaultRouter(router, r'trips', lookup='trip')
trips_router.register(r'destinations', views.TripDestinationViewSet, basename='trip-destinations')
trips_router.register(r'media', views.TripMediaViewSet, basename='trip-media')

urlpatterns = [
    # API routes
    path('', include(router.urls)),
    path('', include(trips_router.urls)),
    
    # Additional API endpoints
    path('search-places/', views.GooglePlacesSearchView.as_view(), name='search-places'),
    path('place-details/<str:place_id>/', views.PlaceDetailsView.as_view(), name='place-details'),
    path('shared/<uuid:share_token>/', views.SharedTripView.as_view(), name='shared-trip'),
    path('my-stats/', views.TripStatsView.as_view(), name='trip-stats'),
    path('shared-with-me/', views.MySharedTripsView.as_view(), name='shared-with-me'),
    
    # Admin routes
    path('admin/media/', views.AdminTripMediaListView.as_view(), name='admin-media-list'),
    path('admin/media/<int:pk>/', views.AdminTripMediaDetailView.as_view(), name='admin-media-detail'),
    path('admin/media/<int:media_id>/moderate/', views.AdminMediaModerationView.as_view(), name='admin-media-moderate'),
    path('admin/trips/', views.AdminTripListView.as_view(), name='admin-trip-list'),
]