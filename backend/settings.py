import os

env = os.environ.get("BIOCLEAN_ENV", "dev")

if env == "prod":
    from .settings_prod import *
else:
    from .settings_dev import *