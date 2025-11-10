# aplicacion/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # 1. Página principal
    path('', views.index_view, name='index'), 

    # 2. Autenticación
    path('login/profesor/', views.login_profesor_view, name='login_profesor'),
    path('login/estudiante/', views.login_estudiante_view, name='login_estudiante'),

    # 3. Registro
    path('registro/profesor/', views.registro_profesor_view, name='registro_profesor'),
    path('registro/estudiante/', views.registro_estudiante_view, name='registro_estudiante'),

    # 4. Perfiles
    path('perfil/profesor/', views.perfil_profesor_view, name='perfil_profesor'),
    path('perfil/estudiante/', views.perfil_estudiante_view, name='perfil_estudiante'),
]
