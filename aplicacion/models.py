from django.db import models
from django.contrib.auth.models import AbstractUser

# Definimos los roles
ROL_CHOICES = (
    ('PROFESOR', 'Profesor'),
    ('ESTUDIANTE', 'Estudiante'),
    ('ADMIN','Administrador'),
)

class Usuario(AbstractUser):
    """Modelo de Usuario Personalizado para añadir el campo rol."""
    
    # Campo para distinguir el tipo de usuario
    rol = models.CharField(
        max_length=20, 
        choices=ROL_CHOICES, 
        default='ESTUDIANTE',
        verbose_name='Rol de Usuario'
    )

    # Campos específicos para Estudiante
    alias = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name='Alias (Estudiante)'
    )
    
    # Campos específicos para Profesor
    correo_institucional = models.EmailField(
        max_length=254, 
        unique=True, 
        blank=True, 
        null=True, 
        verbose_name='Correo Institucional (Profesor)'
    )
    
    # Campos que ya existen en AbstractUser:
    # username, first_name, last_name, email, password, etc.
    
    def __str__(self):
        return f"{self.username} - {self.get_rol_display()}"
        
    class Meta:
        verbose_name = 'Usuario del Sistema'
        verbose_name_plural = 'Usuarios del Sistema'

    def save(self, *args, **kwargs):
        # Si es superusuario, se fuerza el rol ADMIN
        if self.is_superuser:
            self.rol = 'ADMIN'
        super().save(*args, **kwargs)