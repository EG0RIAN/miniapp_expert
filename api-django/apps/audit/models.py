from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from apps.users.models import User
import uuid


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entity_type = models.CharField(max_length=100, db_index=True)
    entity_id = models.CharField(max_length=255, db_index=True)
    action = models.CharField(max_length=100)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    actor_email = models.EmailField(db_index=True)
    actor_role = models.CharField(max_length=50, blank=True, null=True)
    before = models.JSONField(default=dict, blank=True, null=True)
    after = models.JSONField(default=dict, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Журнал аудита'
        verbose_name_plural = 'Журналы аудита'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['actor_email']),
            models.Index(fields=['action']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.action} on {self.entity_type}#{self.entity_id} by {self.actor_email}"

