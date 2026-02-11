# 🐍 EXECUTAR MIGRAÇÃO COM PYTHON

Este script Python descobre automaticamente os nomes das colunas e faz a migração corretamente, independente de ser camelCase ou snake_case.

---

## 📋 Pré-requisitos

### 1. Backup (OBRIGATÓRIO!)

```bash
# SSH na VPS
ssh root@76.13.229.204

# Backup
pg_dump -U admin -d erp_electrosal -F c -b -v -f "/root/backups/erp_electrosal_$(date +%Y%m%d_%H%M%S).backup"
```

### 2. Parar Aplicações

```bash
pm2 stop all
```

### 3. Instalar psycopg2 (se necessário)

```bash
# Verificar se está instalado
python3 -c "import psycopg2" 2>/dev/null && echo "✅ Instalado" || echo "❌ Não instalado"

# Se não estiver instalado:
pip3 install psycopg2-binary
```

---

## 🚀 OPÇÃO 1: Migrar Apenas Media (Primeiro)

Media é independente e outras tabelas dependem dela.

```bash
# Na VPS
cd /root/apps/sistema-erp-electrosal

# Fazer pull do código
git pull origin main

# Dar permissão de execução
chmod +x scripts/migrate-media-first.py

# Executar
python3 scripts/migrate-media-first.py
```

**Saída esperada**:
```
============================================================
MIGRAÇÃO DE MEDIA: public → erp
============================================================

📡 Conectando ao banco...
   ✅ Conectado!

🔄 Migrando Media...
   Colunas no erp.Media: createdAt, filename, height, id, mimetype, ...
   Colunas no public.Media: createdAt, filename, height, id, mimetype, ...
   Colunas comuns: createdAt, filename, height, id, mimetype, ...
   ✅ 23 registros migrados

🔍 Verificando migração...
   public.Media: 23 registros
   erp.Media: 23 registros
   ✅ Migração bem-sucedida!

✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!

📡 Conexão fechada.
```

---

## 🚀 OPÇÃO 2: Migrar Todas as Tabelas

```bash
# Na VPS
cd /root/apps/sistema-erp-electrosal

# Fazer pull do código
git pull origin main

# Dar permissão de execução
chmod +x scripts/migrate-all-tables.py

# Executar
python3 scripts/migrate-all-tables.py
```

**Saída esperada**:
```
============================================================
MIGRAÇÃO COMPLETA: public → erp
============================================================

📡 Conectando ao banco...
   ✅ Conectado!

🔄 Migrando Organization...
   ✅ 1 registros migrados

🔄 Migrando Pessoa...
   ✅ 15 registros migrados

🔄 Migrando User...
   ✅ 5 registros migrados

🔄 Migrando Media...
   ✅ 23 registros migrados

🔄 Migrando LandingPage...
   ✅ 1 registros migrados

🔄 Migrando Section...
   ✅ 3 registros migrados

🔄 Migrando Product...
   ✅ 142 registros migrados

🔄 Migrando Sale...
   ✅ 89 registros migrados

... (continua para todas as tabelas)

============================================================
🔍 VERIFICAÇÃO FINAL
============================================================
✅ Organization                   | public:      1 | erp:      1
✅ Pessoa                         | public:     15 | erp:     15
✅ User                           | public:      5 | erp:      5
✅ Media                          | public:     23 | erp:     23
✅ LandingPage                    | public:      1 | erp:      1
✅ Section                        | public:      3 | erp:      3
✅ Product                        | public:    142 | erp:    142
✅ Sale                           | public:     89 | erp:     89
... (todas as tabelas)

✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!
   59 tabelas processadas

📡 Conexão fechada.
```

---

## ✅ Após Migração Bem-Sucedida

### 1. Reiniciar Aplicações

```bash
# Já deve estar com DATABASE_URL=schema=erp no ecosystem.config.js

pm2 reload ecosystem.config.js --env production --update-env
pm2 save
pm2 status
```

### 2. Testar

```bash
# Backend
curl http://localhost:3001/api/health

# Frontend
curl -I http://localhost:3000

# Acessar no navegador
# https://electrosal.com.br
# https://electrosal.com.br/landing-page-manager
```

---

## 🐛 Troubleshooting

### Erro: "No module named 'psycopg2'"

```bash
pip3 install psycopg2-binary
```

### Erro: "FATAL: password authentication failed"

Verifique as credenciais em DB_CONFIG no script Python:
- host: 172.17.0.1
- user: admin
- password: Electrosal123

### Erro: "could not connect to server"

Verifique se o PostgreSQL está rodando:
```bash
docker ps | grep postgres
```

### Script reporta "⏭️ Tabela não existe"

Isso é normal para tabelas que não foram criadas pelo Prisma ainda. O script pula automaticamente.

---

## 🔴 Rollback (Se Necessário)

```bash
# Voltar para schema public
nano ecosystem.config.js
# Mudar: schema=erp → schema=public

# Reiniciar
pm2 reload ecosystem.config.js --env production --update-env
```

---

## 💡 Vantagens do Script Python

1. **Descobre automaticamente** os nomes das colunas
2. **Funciona com qualquer nomenclatura** (camelCase ou snake_case)
3. **Respeita ordem de dependências** (58 tabelas em ordem correta)
4. **Verifica migração automaticamente**
5. **ON CONFLICT DO NOTHING** (pode executar múltiplas vezes)
6. **Rollback automático** em caso de erro

---

## 📝 O Que o Script Faz

1. Conecta ao banco PostgreSQL
2. Para cada tabela:
   - Verifica se existe em `public` e `erp`
   - Lista colunas de ambos os schemas
   - Encontra colunas em comum
   - Faz `INSERT INTO erp.Tabela SELECT FROM public.Tabela`
   - Usa `ON CONFLICT DO NOTHING` (seguro)
3. Verifica contagens ao final
4. Se tudo OK: COMMIT
5. Se erro: ROLLBACK

---

**Criado em**: 2026-02-09
**Versão**: Python 3.0 (descobre colunas automaticamente)
