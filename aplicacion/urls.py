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
    # *** Rutas de Navegación del Profesor (Botones) ***
    path('profesor/generar-codigo/', views.generar_codigo_clase_view, name='generar_codigo_clase'), # <-- ¡AGREGADA!
    path('profesor/configurar-niveles/', views.configurar_niveles_view, name='configurar_niveles'), # <-- ¡AGREGADA!
    path('profesor/ver-respuestas/', views.ver_respuestas_view, name='ver_respuestas'),
    
    path('perfil/estudiante/', views.perfil_estudiante_view, name='perfil_estudiante'),
    path('juego/capa1/', views.juego_capa_1_view, name='juego_capa_1'),
    path('juego/capa2/', views.juego_capa_2_view, name='juego_capa_2'),
    path('juego/save_result/', views.save_quiz_result, name='save_quiz_result'),
    path('', views.index, name='index'),

    path('logout/', views.logout_view, name='logout'),
]

