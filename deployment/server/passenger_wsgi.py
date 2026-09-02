import os
import sys
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_DIR))

os.environ.setdefault("BIOCLEAN_ENV", "prod")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

from backend.wsgi import application
