"""
Celery configuration for automatic recurring payments
"""
import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')

app = Celery('api')

# Load task modules from all registered Django app configs.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

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

