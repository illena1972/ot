import os

from .settings_base import *


DEBUG = False

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "BIOCLEAN_ALLOWED_HOSTS",
        "127.0.0.1,localhost",
    ).split(",")
    if host.strip()
]

CORS_ALLOW_ALL_ORIGINS = False

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("BIOCLEAN_CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]

# Local installations normally use HTTP inside a protected LAN.
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

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
