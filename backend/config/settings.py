import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-key-change-in-production')

DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'corsheaders',
    'rest_framework',
    'ibff_summarizer',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:4200,http://localhost:4000',
).split(',')

ROOT_URLCONF = 'config.urls'

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': Path(os.environ.get('DB_PATH', str(Path.home() / 'ibff_backend.sqlite3'))),
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

USE_TZ = True
TIME_ZONE = 'UTC'

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}

# Ollama configuration
OLLAMA_ENDPOINT = os.environ.get('OLLAMA_ENDPOINT', 'http://localhost:11434/api/generate')
OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL', 'qwen2.5:3b')
OLLAMA_TIMEOUT = int(os.environ.get('OLLAMA_TIMEOUT', '120'))

# Google Sheets — past event sync
GOOGLE_SHEETS_SPREADSHEET_ID = os.environ.get(
    'GOOGLE_SHEETS_SPREADSHEET_ID',
    '1SCWHcXc3wAqqY5Ye4m54TmNWr-Vx_B56Jnqlyetv-jE',
)
GOOGLE_SERVICE_ACCOUNT_FILE = BASE_DIR / os.environ.get(
    'GOOGLE_SERVICE_ACCOUNT_FILE',
    'credentials/google_service_account.json',
)
SHEETS_SYNC_CACHE_MINUTES = int(os.environ.get('SHEETS_SYNC_CACHE_MINUTES', '60'))
