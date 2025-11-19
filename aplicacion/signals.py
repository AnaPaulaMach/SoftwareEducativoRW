from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import PerfilEstudiante

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def crear_perfil_estudiante(sender, instance, created, **kwargs):
    if created and instance.rol == "ESTUDIANTE":
        PerfilEstudiante.objects.create(user=instance)
