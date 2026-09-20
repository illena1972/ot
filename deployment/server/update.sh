#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPLICATION_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${APPLICATION_DIR}"

if [[ ! -f ".env" ]]; then
    echo "Private configuration .env not found." >&2
    exit 1
fi
if [[ ! -x "venv/bin/python" ]]; then
    echo "Python virtual environment venv not found." >&2
    exit 1
fi

PYTHON="${APPLICATION_DIR}/venv/bin/python"

echo "[1/4] Installing Python dependencies"
"${PYTHON}" -m pip install -r requirements.txt

echo "[2/4] Checking configuration"
"${PYTHON}" manage.py check

echo "[3/4] Migrating all organization databases"
"${PYTHON}" manage.py migrate_all_organizations

echo "[4/4] Collecting static files"
"${PYTHON}" manage.py collectstatic --noinput

mkdir -p tmp
touch tmp/restart.txt
echo "Hosted application update completed."
