# Software Educativo - Aventura TCP/IP

Aplicación web educativa desarrollada con Django para enseñar conceptos de TCP/IP mediante un juego interactivo.

## Requisitos

- **Python**: 3.10 o superior (3.10, 3.11, 3.12, 3.13)
- **Sistema Operativo**: Windows, macOS o Linux (cualquiera funciona)

## Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd SoftwareEducativo
```

### 2. Crear entorno virtual

**En macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**En Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Aplicar migraciones
```bash
python manage.py migrate
```

### 5. Crear superusuario (opcional, para acceder al admin)
```bash
python manage.py createsuperuser
```

### 6. Ejecutar el servidor
```bash
python manage.py runserver
```

La aplicación estará disponible en: http://127.0.0.1:8000

## Notas Importantes

- **Cada desarrollador debe crear su propio entorno virtual** - No compartas tu `venv/` en el repositorio
- **Cada uno tiene su propia base de datos** - El archivo `db.sqlite3` es local y no se comparte
- **Las versiones de Python pueden variar** - Mientras sea 3.10+, no habrá problemas
- **Sistemas operativos diferentes funcionan** - Windows, macOS y Linux son compatibles

## Estructura del Proyecto

- `aplicacion/` - Aplicación principal Django
- `juegoeducativo/` - Configuración del proyecto Django
- `manage.py` - Script de administración de Django
- `requirements.txt` - Dependencias del proyecto
- `.gitignore` - Archivos ignorados por Git

## Solución de Problemas

Si tienes problemas al instalar dependencias:
- Verifica que tienes Python 3.10 o superior: `python --version`
- Asegúrate de tener el entorno virtual activado
- Si hay conflictos, recrea el entorno virtual: `rm -rf venv` y vuelve a crearlo

