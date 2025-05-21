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
    ChangePasswordSerializer, ContactSubmissionSerializer
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

# Custom Login View
class LoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'username': user.username
        })

# Logout View
class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)

# User Profile View - Updated to handle partial updates and email restriction
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsOwnerOrAdmin]
    
    def get_object(self):
        return self.request.user
    
    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        
        # Remove email from the request data if it was sent
        if 'email' in request.data:
            return Response(
                {"email": ["Email cannot be changed after registration."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle profile data, only update fields that were sent
        profile_data = {}
        for key in request.data:
            if key.startswith('profile.'):
                profile_field = key.split('.')[1]
                profile_data[profile_field] = request.data.get(key)
        
        # Update user data
        user_data = {}
        for field in ['first_name', 'last_name', 'username']:
            if field in request.data:
                user_data[field] = request.data.get(field)
        
        if user_data:
            for key, value in user_data.items():
                setattr(user, key, value)
            user.save()
        
        # Update profile if there's profile data
        if profile_data and hasattr(user, 'profile'):
            profile = user.profile
            for key, value in profile_data.items():
                if key == 'profile_picture' and value:
                    profile.profile_picture = value
                elif key in ['bio', 'location', 'phone_number']:
                    setattr(profile, key, value)
            profile.save()
        
        return Response(UserSerializer(user).data)

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
    
    # Update this method in your PasswordResetRequestView class
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
        
        # Prepare the HTML email
        context = {
            'user': user,
            'token': token_obj.token
        }
        html_message = render_to_string('password_reset_email.html', context)
        plain_message = strip_tags(html_message)
        
        # Send the email
        subject = 'TripMate Password Reset Code'
        
        send_mail(
            subject,
            plain_message,  # Text version
            None,  # Use DEFAULT_FROM_EMAIL from settings
            [email],
            html_message=html_message,  # HTML version
            fail_silently=False,
        )
        
        return Response(
            {"detail": "If an account with this email exists, a password reset code has been sent."},
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
