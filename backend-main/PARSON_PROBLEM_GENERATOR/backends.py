from django.contrib.auth.backends import BaseBackend
from .models import User

class CustomUserAuthBackend(BaseBackend):
    def authenticate(self, request, username=None, email=None, password=None):
        # Handle both email and username for authentication
        identifier = email or username
        
        if not identifier or not password:
            return None
            
        try:
            user = User.objects.get(email=identifier)
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None