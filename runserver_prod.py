import os
from waitress import serve

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

from backend.wsgi import application

if __name__ == "__main__":
    host = os.getenv("BIOCLEAN_BIND_HOST", "0.0.0.0")
    port = int(os.getenv("BIOCLEAN_BIND_PORT", "8000"))
    print(f"Сервер запущен: http://{host}:{port}")
    serve(application, host=host, port=port)
