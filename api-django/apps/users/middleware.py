"""
Middleware to disable CSRF for API endpoints
"""
from django.utils.deprecation import MiddlewareMixin


class DisableCSRFForAPI(MiddlewareMixin):
    """
    Middleware to disable CSRF protection for API endpoints.
    This allows API calls from frontend without CSRF tokens.
    """
    
    def process_request(self, request):
        # Disable CSRF for all /api/ endpoints
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None

