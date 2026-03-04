"""
Vercel serverless function entry point for Django backend
"""

import os
import sys

# Add the backend directory to Python path
sys.path.append(os.path.dirname(__file__))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FINALYEARPROJECT.settings')

# Import Django application
from django.core.wsgi import get_wsgi_application

# Get WSGI application
application = get_wsgi_application()

# Vercel serverless handler
def handler(event, context):
    return application(event, context)
