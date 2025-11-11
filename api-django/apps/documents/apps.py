from django.apps import AppConfig


class DocumentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.documents'
    verbose_name = 'Документы'
    
    def ready(self):
        """Импортируем admin при запуске приложения"""
        import apps.documents.admin  # noqa

