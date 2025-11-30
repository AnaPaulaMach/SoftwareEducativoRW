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
        path("profesor/generar-codigo/", views.generar_codigo_clase_view, name="generar_codigo_clase"),

    path('profesor/configurar-niveles/', views.configurar_niveles_view, name='configurar_niveles'), # <-- ¡AGREGADA!
    path('profesor/ver-respuestas/', views.ver_respuestas_view, name='ver_respuestas'),
    # Editar / Eliminar Clase
    path('profesor/clase/<int:clase_id>/editar/', views.editar_clase_view, name='editar_clase'),
    path('profesor/clase/<int:clase_id>/eliminar/', views.eliminar_clase_view, name='eliminar_clase'),


    path('perfil/estudiante/', views.perfil_estudiante_view, name='perfil_estudiante'),
    path('juego/capa1/', views.juego_capa_1_view, name='juego_capa_1'),
    path('juego/capa2/', views.juego_capa_2_view, name='juego_capa_2'),
    path('juego/capa3/', views.juego_capa_3_view, name='juego_capa_3'),
    path('juego/capa4/', views.juego_capa_4_view, name='juego_capa_4'),
    path('juego/capa5/', views.juego_capa_5_view, name='juego_capa_5'),
    path('juego/final/', views.juego_final_view, name='juego_final'),
    path('juego/save_result/', views.save_quiz_result, name='save_quiz_result'),
    path('logout/', views.logout_view, name='logout'),
    path('estudiante/ingresar-clase/', views.join_clase_view, name='join_clase'),
path("reset-codigo/", views.reset_codigo_view, name="reset_codigo"),
path("salir-clase/", views.salir_clase_view, name="salir_clase"),

]

