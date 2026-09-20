import os
from pathlib import Path

from .environment import load_private_environment


load_private_environment(Path(__file__).resolve().parent.parent)

env = os.environ.get("BIOCLEAN_ENV", "dev").strip().lower()

if env == "prod":
    from .settings_prod import *
elif env == "local":
    from .settings_local import *
elif env == "dev":
    from .settings_dev import *
else:
    raise ValueError(
        f"Unsupported BIOCLEAN_ENV '{env}'. Use 'dev', 'local', or 'prod'."
    )
