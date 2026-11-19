#!/usr/bin/env bash
# Restore dump into the inspect PoC Postgres (immich_inspect_postgres).
# Run after: docker compose -f docker-compose.inspect-poc.yml --env-file .env.inspect-poc up -d database
set -euo pipefail

DUMP_FILE="${1:-./inspect-dump/immich.dump}"
POC_DB_CONTAINER="${POC_DB_CONTAINER:-immich_inspect_postgres}"
DB_USER="${DB_USERNAME:-postgres}"

if [[ ! -f "${DUMP_FILE}" ]]; then
  echo "Dump not found: ${DUMP_FILE}" >&2
  exit 1
fi

echo "Waiting for ${POC_DB_CONTAINER}..."
until docker exec "${POC_DB_CONTAINER}" pg_isready -U "${DB_USER}" >/dev/null 2>&1; do
  sleep 2
done

echo "Restoring ${DUMP_FILE} into ${POC_DB_CONTAINER}"
# pg_dumpall output is applied as the postgres superuser inside the clone container only
docker exec -i "${POC_DB_CONTAINER}" psql -U "${DB_USER}" -d postgres < "${DUMP_FILE}"
echo "Restore complete."
