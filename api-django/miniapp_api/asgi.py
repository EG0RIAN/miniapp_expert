"""
ASGI config for miniapp_api project.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'miniapp_api.settings')

application = get_asgi_application()

