import os
from pathlib import Path

from .environment import load_private_environment


load_private_environment(Path(__file__).resolve().parent.parent)

env = os.environ.get("BIOCLEAN_ENV", "dev")

if env == "prod":
    from .settings_prod import *
else:
    from .settings_dev import *
