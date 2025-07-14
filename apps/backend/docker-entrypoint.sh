#!/bin/sh

# Este comando 'set -e' garante que o script irá parar se algum comando falhar.
set -e

echo "Rodando as migrations do Prisma..."
npx prisma migrate deploy

echo "Iniciando a aplicação..."
# O comando 'exec "$@"' executa o comando principal do container (o CMD do Dockerfile).
exec "$@"