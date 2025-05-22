# accounts/views.py

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth.models import User
from django.contrib.auth import logout
from django.shortcuts import get_object_or_404
from .models import UserProfile, ContactSubmission
from .serializers import (
    UserSerializer, RegisterSerializer, UserProfileSerializer,
    ChangePasswordSerializer, ContactSubmissionSerializer, LoginSerializer
)
from .permissions import IsOwnerOrAdmin, IsAdmin

# for password reset
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from .models import PasswordResetToken

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# User Registration
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": token.key
        })


# Custom Login View - Updated to handle email/username
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, created = Token.objects.get_or_create(user=user)
            
            # Return complete user data including profile
            user_serializer = UserSerializer(user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
                'profile': user_serializer.data.get('profile', {})
            })
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Logout View
class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)

# Updated UserProfileView to fix profile picture upload
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsOwnerOrAdmin]
    
    def get_object(self):
        return self.request.user
    
    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        
        # Handle user fields update
        user_updated = False
        for field in ['first_name', 'last_name', 'username']:
            if field in request.data and request.data[field]:
                setattr(user, field, request.data[field])
                user_updated = True
        
        if user_updated:
            user.save()
        
        # Ensure user has a profile
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user)
        
        # Handle profile fields update
        profile_fields = {
            'bio': request.data.get('bio'),
            'location': request.data.get('location'),
            'phone_number': request.data.get('phone_number'),
        }
        
        profile_updated = False
        for field, value in profile_fields.items():
            if value is not None:  # Only update if a value was provided
                setattr(user.profile, field, value)
                profile_updated = True
        
        # Handle profile picture upload - FIXED
        if 'profile_picture' in request.FILES:
            print(f"Profile picture received: {request.FILES['profile_picture']}")
            user.profile.profile_picture = request.FILES['profile_picture']
            profile_updated = True
            print(f"Profile picture set to: {user.profile.profile_picture}")
        
        if profile_updated:
            user.profile.save()
            print(f"Profile saved. Profile picture path: {user.profile.profile_picture}")
        
        # Return the updated user data
        serializer = UserSerializer(user)
        return Response(serializer.data)

# Change Password
class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Check old password
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            
            # Set new password
            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Request a password reset token
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {"email": ["Please provide your email address."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the user with this email
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal that the user doesn't exist for security reasons
            return Response(
                {"detail": "If an account with this email exists, a password reset code has been sent."},
                status=status.HTTP_200_OK
            )
        
        # Generate a reset token
        token_obj = PasswordResetToken.generate_token(user)
        
        # Send the email with the token
        subject = 'TripMate Password Reset Code'
        message = f'''
        Hello {user.first_name},
        
        You requested a password reset for your TripMate account.
        
        Your password reset code is: {token_obj.token}
        
        This code will expire in 15 minutes.
        
        If you did not request this password reset, please ignore this email.
        
        Best regards,
        The TripMate Team
        '''
        
        send_mail(
            subject,
            message,
            None,  # Use DEFAULT_FROM_EMAIL from settings
            [email],
            fail_silently=False,
        )
        
        return Response(
            {"detail": "If an account with this email exists, a password reset code has been sent."},
            status=status.HTTP_200_OK
        )

# Verify the token and reset password
class PasswordResetVerifyView(APIView):
    permission_classes = [AllowAny]
    
    # In accounts/views.py - Update the post method in PasswordResetVerifyView
    def post(self, request):
        email = request.data.get('email')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not email or not token or not new_password:
            return Response(
                {"error": "Please provide email, token, and new password."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the user with this email
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid email address."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if there's a valid token for this user
        try:
            token_obj = PasswordResetToken.objects.filter(
                user=user, 
                token=token, 
                is_used=False
            ).latest('created_at')
            
            if not token_obj.is_valid():
                return Response(
                    {"error": "Token has expired. Please request a new one."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except PasswordResetToken.DoesNotExist:
            return Response(
                {"error": "Invalid token."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Token is valid, set the new password
        user.set_password(new_password)
        user.save()
        
        # Mark the token as used
        token_obj.is_used = True
        token_obj.save()
        
        return Response(
            {"detail": "Password has been reset successfully."},
            status=status.HTTP_200_OK
        )
    
# Contact Form Submission
class ContactSubmissionView(generics.CreateAPIView):
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer
    permission_classes = [permissions.AllowAny]

# Admin Views
class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

class AdminContactSubmissionListView(generics.ListAPIView):
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer
    permission_classes = [IsAdmin]

class AdminContactSubmissionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer
    permission_classes = [IsAdmin]
