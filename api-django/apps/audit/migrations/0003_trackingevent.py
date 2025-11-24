from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('audit', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='TrackingEvent',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('session_id', models.CharField(blank=True, db_index=True, max_length=120)),
                ('user_identifier', models.CharField(blank=True, db_index=True, max_length=120)),
                ('event', models.CharField(db_index=True, max_length=100)),
                ('category', models.CharField(blank=True, db_index=True, max_length=50)),
                ('page', models.CharField(blank=True, max_length=255)),
                ('referrer', models.TextField(blank=True)),
                ('cart_id', models.CharField(blank=True, db_index=True, max_length=120)),
                ('cart_status', models.CharField(blank=True, max_length=50)),
                ('payload', models.JSONField(blank=True, default=dict)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                'verbose_name': 'Событие фронтенда',
                'verbose_name_plural': 'События фронтенда',
                'db_table': 'tracking_events',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='trackingevent',
            index=models.Index(fields=['event', 'category'], name='tracking_e_event_d18da2_idx'),
        ),
        migrations.AddIndex(
            model_name='trackingevent',
            index=models.Index(fields=['session_id'], name='tracking_e_session_fb11cf_idx'),
        ),
        migrations.AddIndex(
            model_name='trackingevent',
            index=models.Index(fields=['user_identifier'], name='tracking_e_user_id_93af4e_idx'),
        ),
        migrations.AddIndex(
            model_name='trackingevent',
            index=models.Index(fields=['cart_id'], name='tracking_e_cart_id_aaed96_idx'),
        ),
        migrations.AddIndex(
            model_name='trackingevent',
            index=models.Index(fields=['-created_at'], name='tracking_e_created_8f1307_idx'),
        ),
    ]





