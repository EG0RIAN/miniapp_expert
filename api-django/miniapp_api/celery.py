"""
Celery configuration for automatic recurring payments
"""
import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'miniapp_api.settings')

app = Celery('miniapp_api')

# Load task modules from all registered Django app configs.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# Explicitly import non-standard task modules so Celery worker registers them
try:
    import apps.payments.tasks_cancellation  # noqa: F401
except Exception:
    # If module is missing, avoid breaking startup; logged in worker/beat
    pass

# Celery Beat schedule for periodic tasks
app.conf.beat_schedule = {
    'process-recurring-payments-daily': {
        'task': 'apps.payments.tasks.process_recurring_payments',
        'schedule': crontab(hour=10, minute=0),  # Каждый день в 10:00
    },
    'send-subscription-reminders': {
        'task': 'apps.payments.tasks.send_subscription_reminders',
        'schedule': crontab(hour=9, minute=0),  # Каждый день в 09:00
    },
    'process-expired-cancellation-requests-hourly': {
        'task': 'apps.payments.tasks_cancellation.process_expired_cancellation_requests',
        'schedule': crontab(minute=0),  # Каждый час
    },
    'send-cancellation-reminders-hourly': {
        'task': 'apps.payments.tasks_cancellation.send_cancellation_reminders',
        'schedule': crontab(minute=30),  # Каждый час в :30
    },
}

# Celery configuration
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
)

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
