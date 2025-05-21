# accounts/urls.py

from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from . import views

from django.contrib.auth import views as auth_views

urlpatterns = [
    # User authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    
    # Password reset
    path('password-reset/', auth_views.PasswordResetView.as_view(), name='password_reset'),
    path('password-reset/done/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),
    path('password-reset-request/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-verify/', views.PasswordResetVerifyView.as_view(), name='password_reset_verify'),
    
    # User profile
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # Contact form
    path('contact/', views.ContactSubmissionView.as_view(), name='contact'),
    
    # Admin routes
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/contacts/', views.AdminContactSubmissionListView.as_view(), name='admin-contact-list'),
    path('admin/contacts/<int:pk>/', views.AdminContactSubmissionDetailView.as_view(), name='admin-contact-detail'),

    
]