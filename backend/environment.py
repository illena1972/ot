"""Small dependency-free loader for private local environment files."""

import os
from pathlib import Path


def load_private_environment(base_dir: Path) -> None:
    """Load simple KEY=VALUE pairs from ``.env`` without overwriting OS values."""
    env_path = base_dir / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key:
            os.environ.setdefault(key, value)
