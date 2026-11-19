#!/usr/bin/env bash
# Run on the Portainer host (10.0.0.20). Creates a logical dump of prod Immich Postgres.
set -euo pipefail

OUT_DIR="${1:-./inspect-dump}"
PROD_DB_CONTAINER="${PROD_DB_CONTAINER:-immich_postgres}"
mkdir -p "${OUT_DIR}"

echo "Dumping ${PROD_DB_CONTAINER} → ${OUT_DIR}/immich.dump"
docker exec -t "${PROD_DB_CONTAINER}" pg_dumpall -U postgres -c > "${OUT_DIR}/immich.dump"
ls -lh "${OUT_DIR}/immich.dump"
echo "Done. Keep this dump offline; it contains your library metadata and embeddings."
