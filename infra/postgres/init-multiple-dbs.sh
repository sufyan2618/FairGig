#!/bin/bash
set -euo pipefail

if [ -z "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
  exit 0
fi

IFS=',' read -r -a db_array <<< "${POSTGRES_MULTIPLE_DATABASES}"

for db_name in "${db_array[@]}"; do
  db_name="$(echo "${db_name}" | xargs)"
  if [ -z "${db_name}" ]; then
    continue
  fi

  echo "Creating database '${db_name}' if it does not exist"
  psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname postgres <<-EOSQL
    SELECT 'CREATE DATABASE ${db_name}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${db_name}')\gexec
EOSQL
done
