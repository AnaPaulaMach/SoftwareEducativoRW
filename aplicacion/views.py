from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth.decorators import login_required
import json
from django.utils import timezone
from django.db import DatabaseError
from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth import logout
import random
import string
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import Clase
from .forms import ClaseForm



# Importar los modelos nuevos
from .models import QuizAttempt, NivelUnlock
# NO NECESITAMOS AuthenticationForm aquí

# ¡IMPORTAMOS LOS FORMULARIOS!
from .forms import (
    EstudianteRegistroForm, 
    ProfesorRegistroForm,
    EstudianteLoginForm,  
    ProfesorLoginForm     
) 

# --- VISTAS DE NAVEGACIÓN ---

def index_view(request):
    """Muestra la página de bienvenida (index.html)."""
    return render(request, 'aplicacion/index.html')

def login_profesor_view(request):
    if request.method == 'POST':
        form = ProfesorLoginForm(request, data=request.POST) 
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None and user.rol == 'PROFESOR':
                login(request, user)
                return redirect('perfil_profesor')
            else:
                form.add_error(None, "Credenciales inválidas o no eres profesor.")
    else:
        form = ProfesorLoginForm()
    
    return render(request, 'aplicacion/profesor/login_profesor.html', {'login_form': form})

def login_estudiante_view(request):
    if request.method == 'POST':
        form = EstudianteLoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None and user.rol == 'ESTUDIANTE':
                login(request, user)
                return redirect('perfil_estudiante')
            else:
                form.add_error(None, "Credenciales inválidas o no eres estudiante.")
    else:
        form = EstudianteLoginForm()
    
    return render(request, 'aplicacion/estudiante/login_estudiante.html', {'login_form': form})

# (Eliminamos login_view redundante)

def registro_profesor_view(request):
    """Muestra y procesa el formulario de REGISTRO de Profesor."""
    if request.method == 'POST':
        form = ProfesorRegistroForm(request.POST)
        if form.is_valid():
            user = form.save() 
            login(request, user) 
            return redirect('perfil_profesor') 
    else:
        form = ProfesorRegistroForm()
        
    return render(request, 'aplicacion/profesor/registro_profesor.html', {'form': form})


def registro_estudiante_view(request):
    """Muestra y procesa el formulario de REGISTRO de Estudiante."""
    if request.method == 'POST':
        form = EstudianteRegistroForm(request.POST)
        if form.is_valid():
            user = form.save() 
            login(request, user) 
            # Asegurar que un usuario recién creado no tenga niveles desbloqueados
            try:
                # Eliminamos cualquier registro de NivelUnlock inesperado para este usuario
                NivelUnlock.objects.filter(user=user).exclude(level=1).delete()
            except Exception:
                # No detener el flujo si hay un problema al limpiar la tabla
                pass
            return redirect('perfil_estudiante') 
    else:
        form = EstudianteRegistroForm()
        
    return render(request, 'aplicacion/estudiante/registro_estudiante.html', {'form': form})

def perfil_profesor_view(request):
    return render(request, 'aplicacion/profesor/perfil_profesor.html')


def perfil_estudiante_view(request):
    """Muestra el menú de niveles para el estudiante."""
    # Comprobar en la base de datos si el usuario ya desbloqueó el nivel 2
    unlocked_level_2 = False
    if request.user.is_authenticated:
        try:
            unlocked_level_2 = NivelUnlock.objects.filter(user=request.user, level=2).exists()
        except (DatabaseError, Exception) as e:
            # Si la tabla todavía no existe (migrations no aplicadas) o hay otro error de DB,
            # no rompemos la vista: devolvemos unlocked_level_2 = False como fallback.
            # Esto evita que la interfaz rompa al hacer clic en "Volver al Menú" antes de aplicar migrations.
            unlocked_level_2 = False
            # Opcional: podríamos loguear el error en un logger si se desea.

    return render(request, 'aplicacion/estudiante/perfil_estudiante.html', {'unlocked_level_2': unlocked_level_2})


@login_required
def save_quiz_result(request):
    """Endpoint que recibe JSON con las respuestas/puntuación y lo guarda en la BD.

    Espera JSON: { score: int, level: int (opcional), answers: [...] }
    Si score > 8 entonces crea/asegura un NivelUnlock para level=2.
    Devuelve JSON { ok: true }
    """
    if request.method != 'POST':
        return HttpResponseBadRequest('POST required')

    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest('Invalid JSON')

    score = int(payload.get('score', 0))
    level = int(payload.get('level', 1))
    answers = payload.get('answers', {})

    # Guardar intento de quiz
    attempt = QuizAttempt.objects.create(
        user=request.user,
        level=level,
        score=score,
        answers=answers,
    )

    # Si aplica, desbloquear Nivel 2
    try:
        if score > 8:
            NivelUnlock.objects.get_or_create(user=request.user, level=2)
    except Exception:
        # no bloquear el flujo si algo falla secundario
        pass

    return JsonResponse({'ok': True, 'attempt_id': attempt.id})

# --- VISTA DEL JUEGO (NUEVA VISTA) ---
def juego_capa_1_view(request):
    """Renderiza la actividad de arrastrar y soltar para el Nivel 1 (Capa de Aplicación)."""
    return render(request, 'aplicacion/estudiante/juego_capa_1.html')


def juego_capa_2_view(request):
    """Plantilla placeholder para Nivel 2."""
    return render(request, 'aplicacion/estudiante/juego_capa_2.html')

def index(request):
    """
    Función de vista simple que devuelve un mensaje de 'Hola, mundo'.
    """
    return HttpResponse("<h1>¡Hola, mundo desde Django!</h1>")


# aplicacion/views.py
# ... (Mantén todos tus imports y funciones anteriores) ...

from django.contrib.auth import logout # ¡Necesitas este import para el logout!
from django.contrib.auth.decorators import login_required 
from django.shortcuts import render, redirect 

# --- NUEVAS VISTAS NECESARIAS ---
# arriba del archivo, asegurate de tener:
import random
import string
from django.contrib.auth.decorators import login_required
from .models import Clase
from .forms import ClaseForm

# función utilitaria para generar códigos únicos
def generar_codigo_unico(length=6):
    """Genera un código alfanumérico único para Clase."""
    while True:
        codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
        if not Clase.objects.filter(codigo_acceso=codigo).exists():
            return codigo

@login_required
def generar_codigo_clase_view(request):
    profesor = request.user

    # carga inicial de clases del profesor (mostramos siempre la lista actualizada)
    clases_creadas = Clase.objects.filter(profesor=profesor).order_by('-creado_en')

    if request.method == "POST":
        form = ClaseForm(request.POST)
        if form.is_valid():
            # creamos la instancia sin guardar (para asignar profesor y codigo)
            clase = form.save(commit=False)
            clase.profesor = profesor
            clase.codigo_acceso = generar_codigo_unico()
            clase.save()

            # recargar lista para que incluya la nueva clase
            clases_creadas = Clase.objects.filter(profesor=profesor).order_by('-creado_en')

            mensaje = f"Código de clase para {clase.materia or 'la materia'} de {clase.carrera or 'la carrera'} creado con éxito."

            # devolver la página mostrando el resultado y ocultando el form
            return render(request, "aplicacion/profesor/profesor_generar_codigo.html", {
                "form": ClaseForm(),                # formulario vacio en caso de crear otra
                "clase": clase,                     # clase recien creada (para mostrar codigo)
                "mensaje": mensaje,
                "clases_creadas": clases_creadas,   # lista actualizada
                "mostrar_form": False,              # ocultar form tras crear la clase
            })
        else:
            # si el form no es válido caemos aquí: mostramos el form con errores
            return render(request, "aplicacion/profesor/profesor_generar_codigo.html", {
                "form": form,
                "clases_creadas": clases_creadas,
                "mostrar_form": True,
            })

    # GET: mostrar el formulario por defecto
    form = ClaseForm()
    return render(request, "aplicacion/profesor/profesor_generar_codigo.html", {
        "form": form,
        "clases_creadas": clases_creadas,
        "mostrar_form": True,
    })


@login_required
def configurar_niveles_view(request):
    """Vista placeholder para Configurar Niveles."""
    # TODO: Implementar la lógica real aquí
    return render(request, 'aplicacion/profesor/profesor_configurar_niveles.html', {'message': 'Configurar Niveles (WIP)'})

@login_required
def ver_respuestas_view(request):
    """Vista placeholder para Ver Respuestas."""
    # TODO: Implementar la lógica real aquí
    return render(request, 'aplicacion/profesor/profesor_ver_respuestas.html', {'message': 'Ver Respuestas (WIP)'})


# --- VISTA DE LOGOUT ---

def logout_view(request):
    """Cierra la sesión del usuario y redirige al index."""
    if request.user.is_authenticated:
        logout(request)
    return redirect('index') # Redirige a la URL con name='index'

# ... (Mantén todas tus funciones anteriores) ...

# Asegúrate de que tu vista perfil_profesor_view quede así (si no la habías decorado):
@login_required 
def perfil_profesor_view(request):
    return render(request, 'aplicacion/profesor/perfil_profesor.html')

@login_required
def crear_clase_view(request):
    """
    Crea una clase en la BD.
    Espera POST con: codigo, descripcion
    """
    if request.method != "POST":
        return HttpResponseBadRequest("Método inválido")

    try:
        data = json.loads(request.body)
    except:
        return HttpResponseBadRequest("JSON inválido")

    codigo = data.get("codigo")
    descripcion = data.get("descripcion", "")

    if not codigo:
        return HttpResponseBadRequest("Falta el código")

    # Guarda en DB
    clase = Clase.objects.create(
        codigo_acceso=codigo,
        descripcion=descripcion,
        profesor=request.user
    )

    return JsonResponse({
        "ok": True,
        "id": clase.id,
        "codigo": clase.codigo_acceso,
        "descripcion": clase.descripcion,
        "creado_en": clase.creado_en.strftime("%d/%m/%Y %H:%M")
    })


@login_required
def listar_clases_view(request):
    """
    Devuelve todas las clases creadas por el profesor.
    """
    clases = Clase.objects.filter(profesor=request.user).order_by("-creado_en")

    return JsonResponse({
        "clases": [
            {
                "id": c.id,
                "codigo": c.codigo_acceso,
                "descripcion": c.descripcion,
                "creado_en": c.creado_en.strftime("%d/%m/%Y %H:%M")
            }
            for c in clases
        ]
    })   

@login_required
def editar_clase_view(request, clase_id):
    clase = get_object_or_404(Clase, id=clase_id)

    # Solo el profesor creador puede editarla
    if clase.profesor != request.user:
        return HttpResponseForbidden("No tienes permiso para editar esta clase.")

    if request.method == "POST":
        form = ClaseForm(request.POST, instance=clase)
        if form.is_valid():
            form.save()
            return redirect("generar_codigo_clase")
    else:
        form = ClaseForm(instance=clase)

    return render(request, "aplicacion/profesor/editar_clase.html", {
        "form": form,
        "clase": clase
    })

@login_required
def eliminar_clase_view(request, clase_id):
    clase = get_object_or_404(Clase, id=clase_id)

    # Verifica que solo el profesor dueño pueda eliminarla
    if clase.profesor != request.user:
        return HttpResponseForbidden("No tienes permiso para eliminar esta clase.")

    if request.method == "POST":
        clase.delete()
        return redirect("generar_codigo_clase")

    return render(request, "aplicacion/profesor/eliminar_clase.html", {
        "clase": clase
    })
