import os
from waitress import serve

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")  # замените config.settings

from backend.wsgi import application  # замените config на имя вашего проекта

if __name__ == "__main__":
    print("Сервер запущен!")
    serve(application, host="0.0.0.0", port=8000)

    