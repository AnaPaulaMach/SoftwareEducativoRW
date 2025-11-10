from django import forms
from .models import Usuario
from django.contrib.auth.forms import AuthenticationForm # <-- Necesario para los Login Forms

# --- Formulario Base para todos los registros ---
class BaseRegistroForm(forms.ModelForm):
    """Define los campos comunes a ambos roles."""
    
    # Campo extra para confirmar la contraseña
    password_confirm = forms.CharField(
        widget=forms.PasswordInput, 
        label='Confirmar Contraseña'
    )
    
    class Meta:
        model = Usuario
        # Campos comunes a ambos: nombre, apellido, contraseña
        fields = ['first_name', 'last_name', 'password', 'password_confirm']
        widgets = {
            'password': forms.PasswordInput(),
        }
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

# --- Formulario de Registro para ESTUDIANTE ---
class EstudianteRegistroForm(BaseRegistroForm):
    
    class Meta(BaseRegistroForm.Meta):
        # Campos del estudiante: los comunes + alias + un 'username' para login
        fields = BaseRegistroForm.Meta.fields + ['username', 'alias']
        labels = {
            **BaseRegistroForm.Meta.labels,
            'username': 'Correo Electrónico', # Usamos el email como username
            'alias': 'Alias / Nickname',
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

# --- Formulario de Registro para PROFESOR ---
class ProfesorRegistroForm(BaseRegistroForm):
    
    class Meta(BaseRegistroForm.Meta):
        fields = BaseRegistroForm.Meta.fields + ['correo_institucional']
        labels = {
            **BaseRegistroForm.Meta.labels,
            'correo_institucional': 'Correo Institucional',
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
        
        # Opcional: Añadir placeholders
        self.fields['username'].widget.attrs.update(
            {'placeholder': 'tu_correo@institucion.edu'}
        )
        self.fields['password'].widget.attrs.update(
            {'placeholder': 'Tu contraseña'}
        )

        