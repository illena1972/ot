"""Database configuration shared by local and hosted deployments."""

import os
from pathlib import Path


def build_database_config(prefix: str, sqlite_path: Path) -> dict:
    """Build a Django database configuration from environment variables.

    SQLite remains the safe default while the existing installation is being
    migrated. Set ``<PREFIX>_ENGINE=mysql`` to use MySQL in a new installation.
    """
    engine = os.getenv(f"{prefix}_ENGINE", "sqlite").lower()

    if engine == "mysql":
        return {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.environ[f"{prefix}_NAME"],
            "USER": os.environ[f"{prefix}_USER"],
            "PASSWORD": os.environ[f"{prefix}_PASSWORD"],
            "HOST": os.getenv(f"{prefix}_HOST", "127.0.0.1"),
            "PORT": os.getenv(f"{prefix}_PORT", "3306"),
            "CONN_MAX_AGE": 60,
            "OPTIONS": {
                "charset": "utf8mb4",
                "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
            },
        }

    if engine != "sqlite":
        raise ValueError(
            f"Unsupported database engine '{engine}'. Use 'sqlite' or 'mysql'."
        )

    return {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": sqlite_path,
    }
