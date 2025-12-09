import re

from django import forms
from django.contrib.auth.forms import AuthenticationForm  # <-- Necesario para los Login Forms
from .models import Clase, Usuario

# --- Formulario Base para todos los registros ---
# Modificación en aplicacion/forms.py

# --- Formulario Base para todos los registros ---
class BaseRegistroForm(forms.ModelForm):
    """Define los campos comunes a ambos roles y los hace requeridos."""

    # Redefinimos los campos para forzar la propiedad required=True
    # (El campo ya está en el modelo Usuario, pero lo definimos aquí para el Formulario)
    first_name = forms.CharField(max_length=150, label='Nombre')
    last_name = forms.CharField(max_length=150, label='Apellido')
    password = forms.CharField(
        label='Contraseña',
        widget=forms.PasswordInput,
        help_text='Mínimo 8 caracteres, con letras y números.'
    )

    # Campo extra para confirmar la contraseña
    password_confirm = forms.CharField(
        widget=forms.PasswordInput,
        label='Confirmar Contraseña'
    )

    class Meta:
        model = Usuario
        # Campos comunes a ambos: nombre, apellido, contraseña
        fields = ['first_name', 'last_name', 'password', 'password_confirm']
        labels = {
            'first_name': 'Nombre',
            'last_name': 'Apellido',
            'password': 'Contraseña',
        }

    # Función de validación de contraseñas (para ambos)
    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        password_confirm = cleaned_data.get("password_confirm")

        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError(
                "Las contraseñas no coinciden."
            )
        return cleaned_data

    def clean_password(self):
        password = self.cleaned_data.get("password", "")
        if not password:
            return password

        errors = []
        if len(password) < 8:
            errors.append("Debe tener al menos 8 caracteres.")
        if not re.search(r"[A-Z]", password):
            errors.append("Debe incluir al menos una letra mayúscula.")
        if not re.search(r"[a-z]", password):
            errors.append("Debe incluir al menos una letra minúscula.")
        if not re.search(r"\d", password):
            errors.append("Debe incluir al menos un número.")

        if errors:
            raise forms.ValidationError(
                "La contraseña no cumple los requisitos: " + " ".join(errors)
            )
        return password

    def clean_first_name(self):
        nombre = (self.cleaned_data.get("first_name") or "").strip()
        if not nombre:
            raise forms.ValidationError("Ingresa un nombre válido.")
        return nombre

    def clean_last_name(self):
        apellido = (self.cleaned_data.get("last_name") or "").strip()
        if not apellido:
            raise forms.ValidationError("Ingresa un apellido válido.")
        return apellido

# --- Formulario de Registro para ESTUDIANTE ---
class EstudianteRegistroForm(BaseRegistroForm):
    username = forms.EmailField(
        label='Correo Electrónico',
        max_length=254,
        help_text='Usaremos tu correo para iniciar sesión.'
    )
    alias = forms.CharField(
        label='Alias / Nickname',
        max_length=100,
        required=True,
        help_text='Entre 3 y 100 caracteres.'
    )

    class Meta(BaseRegistroForm.Meta):
        # Campos del estudiante: los comunes + alias + un 'username' para login
        fields = BaseRegistroForm.Meta.fields + ['username', 'alias']
        labels = {
            **BaseRegistroForm.Meta.labels,
            'username': 'Correo Electrónico', # Usamos el email como username
            'alias': 'Alias / Nickname',
        }
        # AÑADIDO: Mensaje de unicidad para el username del estudiante (limpio)
        error_messages = {
            'username': {
                'unique': "Ya existe un usuario registrado con este correo electrónico.",
            }
        }


    def save(self, commit=True):
        # 1. Guarda el usuario
        user = super().save(commit=False)
        # 2. Establece la contraseña
        user.set_password(self.cleaned_data["password"])
        # 3. Asigna el rol
        user.rol = 'ESTUDIANTE' 
        # 4. Guarda en la DB
        if commit:
            user.save()
        return user

    def clean_alias(self):
        alias = (self.cleaned_data.get("alias") or "").strip()
        if len(alias) < 3:
            raise forms.ValidationError("El alias debe tener al menos 3 caracteres.")
        return alias

# --- Formulario de Registro para PROFESOR ---
class ProfesorRegistroForm(BaseRegistroForm):
    
    class Meta(BaseRegistroForm.Meta):
        fields = BaseRegistroForm.Meta.fields + ['correo_institucional']
        labels = {
            **BaseRegistroForm.Meta.labels,
            'correo_institucional': 'Correo Institucional',
        }
        # AÑADIDO: Mensaje de unicidad para el correo del profesor (limpio)
        error_messages = {
            'correo_institucional': {
                'unique': "Ya existe un usuario registrado con este correo institucional.",
            }
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Placeholder para ayudar al usuario
        self.fields['correo_institucional'].widget.attrs.update({
            'placeholder': 'ejemplo@institucion.edu.ar'
        })

    def clean_correo_institucional(self):
        """Valida que el correo institucional termine en '.edu.ar'."""
        correo = self.cleaned_data.get('correo_institucional')

        if not correo or not correo.endswith('.edu.ar'):
            raise forms.ValidationError(
                "El correo institucional debe pertenecer a un dominio '.edu.ar'."
            )
        return correo

    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = self.cleaned_data["correo_institucional"]
        user.set_password(self.cleaned_data["password"])
        user.rol = 'PROFESOR'
        if commit:
            user.save()
        return user


# --- Formulario de LOGIN para ESTUDIANTE (CUSTOM) ---
class EstudianteLoginForm(AuthenticationForm):
    """Formulario de LOGIN para Estudiantes."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Cambiamos las etiquetas (labels)
        self.fields['username'].label = 'Correo Electrónico'
        self.fields['password'].label = 'Contraseña'
        
        # AÑADIDO: Personalizar el mensaje de error de credenciales incorrectas
        self.error_messages['invalid_login'] = (
            "El correo o la contraseña son incorrectos. Inténtalo de nuevo."
        )
        
        # Opcional: Añadir placeholders
        self.fields['username'].widget.attrs.update(
            {'placeholder': 'tu_correo@ejemplo.com'}
        )
        self.fields['password'].widget.attrs.update(
            {'placeholder': 'Tu contraseña'}
        )

# --- Formulario de LOGIN para PROFESOR (CUSTOM) ---
class ProfesorLoginForm(AuthenticationForm):
    """Formulario de LOGIN para Profesores."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Cambiamos las etiquetas (labels)
        self.fields['username'].label = 'Correo Institucional: '
        self.fields['password'].label = 'Contraseña: '
        
        # AÑADIDO: Personalizar el mensaje de error de credenciales incorrectas
        self.error_messages['invalid_login'] = (
            "El Correo Institucional o la contraseña son incorrectos. Inténtalo de nuevo."
        )
        
        # Opcional: Añadir placeholders
        self.fields['username'].widget.attrs.update(
            {'placeholder': 'tu_correo@institucion.edu'}
        )
        self.fields['password'].widget.attrs.update(
            {'placeholder': 'Tu contraseña'} 
        )


class ClaseForm(forms.ModelForm):
    class Meta:
        model = Clase
        fields = ['materia', 'carrera', 'descripcion']
        widgets = {
            'descripcion': forms.Textarea(attrs={'rows': 3}),
        }


    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Hacer obligatorios
        self.fields['materia'].required = True
        self.fields['carrera'].required = True

        # Dejar opcional
        self.fields['descripcion'].required = False


# Selector reutilizable para que el profesor elija una clase propia.
class SeleccionarClaseForm(forms.Form):
    clase = forms.ModelChoiceField(
        queryset=Clase.objects.none(),
        label='Seleccionar clase',
        empty_label='Seleccione una clase'
    )

    def __init__(self, *args, **kwargs):
        profesor = kwargs.pop('profesor')
        super().__init__(*args, **kwargs)
        self.fields['clase'].queryset = Clase.objects.filter(profesor=profesor).order_by('-creado_en')
        self.fields['clase'].widget.attrs.update({'class': 'select-clase'})


NIVEL_CHOICES = (
    (1, 'Nivel 1 - Capa de Aplicación'),
    (2, 'Nivel 2 - Capa de Transporte'),
    (3, 'Nivel 3 - Capa de Red'),
    (4, 'Nivel 4 - Capa de Enlace'),
    (5, 'Nivel 5 - Capa Física'),
    (6, 'Nivel Final - Prueba Global'),
)


# Form plano con un toggle por nivel (checkbox) para habilitar/bloquear.
class ConfigurarNivelesForm(forms.Form):
    level_1 = forms.BooleanField(label=NIVEL_CHOICES[0][1], required=True, initial=True, disabled=True)
    level_2 = forms.BooleanField(label=NIVEL_CHOICES[1][1], required=False)
    level_3 = forms.BooleanField(label=NIVEL_CHOICES[2][1], required=False)
    level_4 = forms.BooleanField(label=NIVEL_CHOICES[3][1], required=False)
    level_5 = forms.BooleanField(label=NIVEL_CHOICES[4][1], required=False)
    level_6 = forms.BooleanField(label=NIVEL_CHOICES[5][1], required=False)
    
    # Especificar el orden de los campos para asegurar que se muestren en el orden correcto
    field_order = ['level_1', 'level_2', 'level_3', 'level_4', 'level_5', 'level_6']