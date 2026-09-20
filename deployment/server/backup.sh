#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPLICATION_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
PYTHON="${APPLICATION_DIR}/venv/bin/python"
LOCK_DIRECTORY="${APPLICATION_DIR}/tmp/database-backup.lock"
LOG_DIRECTORY="${APPLICATION_DIR}/backups/database-logs"
LOG_FILE="${LOG_DIRECTORY}/backup.log"
OUTPUT_FILE="${APPLICATION_DIR}/tmp/database-backup-output.$$"

umask 077
mkdir -p "${APPLICATION_DIR}/tmp"
mkdir -p "${LOG_DIRECTORY}"

if ! mkdir "${LOCK_DIRECTORY}" 2>/dev/null; then
    echo "Database backup is already running." >&2
    exit 1
fi

cleanup() {
    rm -f "${OUTPUT_FILE}"
    rmdir "${LOCK_DIRECTORY}"
}
trap cleanup EXIT

cd "${APPLICATION_DIR}"

if "${PYTHON}" manage.py backup_databases >"${OUTPUT_FILE}" 2>&1; then
    {
        printf '\n[%s] SUCCESS\n' "$(date --iso-8601=seconds)"
        cat "${OUTPUT_FILE}"
    } >>"${LOG_FILE}"
else
    status=$?
    {
        printf '\n[%s] ERROR (exit code %s)\n' "$(date --iso-8601=seconds)" "${status}"
        cat "${OUTPUT_FILE}"
    } >>"${LOG_FILE}"
    cat "${OUTPUT_FILE}" >&2
    exit "${status}"
fi
