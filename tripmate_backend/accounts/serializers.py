# accounts/serializers.py - Updated with better error messages

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile, ContactSubmission
from django.core.exceptions import ValidationError as DjangoValidationError

# In accounts/serializers.py - update UserProfileSerializer
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('bio', 'profile_picture', 'location', 'phone_number')
        read_only_fields = () # Empty tuple allows all fields to be updated
        
class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile', 'is_active', 'is_staff')
        read_only_fields = ('id', 'email')  # Make email read-only

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': True, 'error_messages': {'required': 'Please enter your first name'}},
            'last_name': {'required': True, 'error_messages': {'required': 'Please enter your last name'}},
            'email': {'required': True, 'error_messages': {'required': 'Please enter your email address'}},
            'username': {'error_messages': {'required': 'Please choose a username'}}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password2": "The two password fields didn't match."})
        
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as e:
            # Customize the password validation error messages
            errors = []
            for error in e.error_list:
                if "This password is too short" in str(error):
                    errors.append("Password must be at least 6 characters long.")
                else:
                    errors.append(str(error))
            
            raise serializers.ValidationError({"password": errors})
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password2 = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Your current password was entered incorrectly. Please try again.")
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password2": "The confirm password fields didn't match."})
        
        try:
            validate_password(attrs['new_password'])
        except DjangoValidationError as e:
            # Customize the password validation error messages
            errors = []
            for error in e.error_list:
                if "This password is too short" in str(error):
                    errors.append("Password must be at least 6 characters long.")
                else:
                    errors.append(str(error))
            
            raise serializers.ValidationError({"new_password": errors})
            
        return attrs

class ContactSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactSubmission
        fields = '__all__'
        read_only_fields = ('is_resolved',)
        extra_kwargs = {
            'name': {'error_messages': {'required': 'Please enter your name'}},
            'email': {'error_messages': {'required': 'Please enter your email address'}},
            'subject': {'error_messages': {'required': 'Please provide a subject for your message'}},
            'message': {'error_messages': {'required': 'Please write your message'}}
        }