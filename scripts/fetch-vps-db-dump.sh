#!/bin/bash

# ==============================================================================
# Script de Exportação do Banco de Dados da Hostinger VPS e Carga no Docker Local
# ==============================================================================

set -e

VPS_IP="76.13.229.204"
VPS_USER="root"
DUMP_FILE="dump_atual_vps_$(date +%Y-%m-%d_%H-%M-%S).sql"

echo "🐘 ========================================================"
echo "   Gerando Backup Atualizado da Hostinger VPS (${VPS_IP})"
echo "   ========================================================"
echo ""

# Pergunta credenciais SSH ou assume root
read -p "Digite o usuário SSH da VPS Hostinger [default: root]: " INPUT_USER
VPS_USER=${INPUT_USER:-root}

read -p "Digite o nome do banco de dados na Hostinger [default: erp_electrosal]: " DB_NAME
DB_NAME=${DB_NAME:-erp_electrosal}

read -p "Digite o usuário do PostgreSQL na Hostinger [default: admin]: " DB_USER
DB_USER=${DB_USER:-admin}

echo ""
echo "📥 1. Conectando na VPS via SSH e gerando pg_dump..."
ssh ${VPS_USER}@${VPS_IP} "docker exec -i erp_postgres pg_dump -U ${DB_USER} -d ${DB_NAME} --clean --if-exists" > "${DUMP_FILE}" || \
ssh ${VPS_USER}@${VPS_IP} "pg_dump -U ${DB_USER} -d ${DB_NAME} --clean --if-exists" > "${DUMP_FILE}"

echo "✅ Backup salvo com sucesso em: ${DUMP_FILE}"
echo ""

echo "🔄 2. Restaurando o backup no container Docker local (electrosal-postgres)..."
if docker ps | grep -q electrosal-postgres; then
    docker exec -i electrosal-postgres psql -U postgres -d sistema_electrosal_dev < "${DUMP_FILE}"
    echo "🎉 ========================================================"
    echo "   BANCO LOCAL ATUALIZADO COM SUCESSO!"
    echo "   ========================================================"
else
    echo "⚠️ Container 'electrosal-postgres' não está rodando localmente."
    echo "   Execute 'docker compose up -d' e depois rode:"
    echo "   docker exec -i electrosal-postgres psql -U postgres -d sistema_electrosal_dev < ${DUMP_FILE}"
fi
