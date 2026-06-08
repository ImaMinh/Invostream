#!/bin/bash

# Ensure services are up
# docker compose up -d zookeeper kafka debezium postgres clickhouse

echo "Registering Debezium PostgreSQL Connector..."

curl -i -X POST -H "Accept:application/json" -H "Content-Type:application/json" \
  http://localhost:8083/connectors/ -d @debezium_postgres_source.json

echo -e "\n\nConnector registered! You can check the status at:"
echo "http://localhost:8083/connectors/invostream-postgres-connector/status"
