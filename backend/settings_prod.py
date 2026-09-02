import os

from .settings_base import *

DEBUG = False

ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
    "172.23.0.199",
]

CORS_ALLOW_ALL_ORIGINS = False

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("BIOCLEAN_CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]

if MULTI_TENANT_ENABLED:
    ALLOWED_HOSTS = ['*']

# WhiteNoise для раздачи static через Waitress
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    *MIDDLEWARE[1:],
]

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
