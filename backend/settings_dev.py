from .settings_base import *

DEBUG = True

ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
]

CORS_ALLOW_ALL_ORIGINS = True

if MULTI_TENANT_ENABLED:
    ALLOWED_HOSTS = ['*']
