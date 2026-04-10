# 🔄 Migração para Schema ERP

## ⚠️ ATENÇÃO - OPERAÇÃO CRÍTICA

Esta migração copia **TODOS os dados** do schema `public` para o schema `erp`. É uma operação irreversível se não houver backup.

---

## 📋 Pré-requisitos

### 1. Backup Completo do Banco

```bash
# SSH na VPS
ssh root@76.13.229.204

# Backup do banco inteiro
pg_dump -U admin -d erp_electrosal -F c -b -v -f "/root/backups/erp_electrosal_$(date +%Y%m%d_%H%M%S).backup"

# Verificar tamanho do backup
ls -lh /root/backups/

# COPIAR BACKUP PARA MÁQUINA LOCAL (segurança adicional)
# Na sua máquina local:
scp root@76.13.229.204:/root/backups/erp_electrosal_*.backup ~/backups/
```

### 2. Parar Aplicações

```bash
# Na VPS
pm2 stop all

# Verificar que nada está rodando
pm2 status
```

### 3. Verificar Espaço em Disco

```bash
# Verificar espaço disponível
df -h

# Tamanho atual do banco
du -sh /var/lib/postgresql/data/
```

---

## 🚀 Execução da Migração

### Passo 1: Executar Script SQL

```bash
# Na VPS
cd /root/apps/sistema-erp-electrosal

# Executar script de migração
psql -U admin -d erp_electrosal -f scripts/migrate-to-erp-schema.sql

# O script vai:
# 1. Criar schema erp
# 2. Copiar TODAS as tabelas
# 3. Mostrar contagem de registros para verificação
```

### Passo 2: Verificar Dados Copiados

```sql
-- Conectar ao banco
psql -U admin -d erp_electrosal

-- Verificar tabelas no schema erp
\dt erp.*

-- Comparar contagens
SELECT
  'public' as schema,
  (SELECT COUNT(*) FROM public."User") as users,
  (SELECT COUNT(*) FROM public."Organization") as organizations,
  (SELECT COUNT(*) FROM public."LandingPage") as landing_pages,
  (SELECT COUNT(*) FROM public."Section") as sections,
  (SELECT COUNT(*) FROM public."Media") as media,
  (SELECT COUNT(*) FROM public."Product") as products,
  (SELECT COUNT(*) FROM public."Sale") as sales;

SELECT
  'erp' as schema,
  (SELECT COUNT(*) FROM erp."User") as users,
  (SELECT COUNT(*) FROM erp."Organization") as organizations,
  (SELECT COUNT(*) FROM erp."LandingPage") as landing_pages,
  (SELECT COUNT(*) FROM erp."Section") as sections,
  (SELECT COUNT(*) FROM erp."Media") as media,
  (SELECT COUNT(*) FROM erp."Product") as products,
  (SELECT COUNT(*) FROM erp."Sale") as sales;

-- Sair
\q
```

**✅ Os números DEVEM ser IGUAIS!**

### Passo 3: Atualizar DATABASE_URL

```bash
# Na VPS
cd /root/apps/sistema-erp-electrosal

# Editar ecosystem.config.js
nano ecosystem.config.js

# ALTERAR linha 35:
# DE:
DATABASE_URL: "postgresql://admin:Electrosal123@172.17.0.1:5432/erp_electrosal?schema=public",

# PARA:
DATABASE_URL: "postgresql://admin:Electrosal123@172.17.0.1:5432/erp_electrosal?schema=erp",

# Salvar: Ctrl+O, Enter, Ctrl+X
```

### Passo 4: Reiniciar Aplicações

```bash
# Recarregar PM2 com novas variáveis
pm2 reload ecosystem.config.js --env production --update-env

# Salvar configuração
pm2 save

# Verificar status
pm2 status

# Ver logs em tempo real
pm2 logs --lines 50
```

### Passo 5: Testar Sistema

```bash
# Backend
curl http://localhost:3001/api/health
# Deve retornar: {"status":"ok"}

# Frontend
curl -I http://localhost:3000
# Deve retornar: HTTP/1.1 200 OK
```

**Acessar no navegador**:
- https://electrosal.com.br
- https://electrosal.com.br/landing-page-manager

**Testar**:
- ✅ Login funciona
- ✅ Landing page carrega
- ✅ Manager carrega
- ✅ Biblioteca de mídia funciona
- ✅ Produtos aparecem
- ✅ Vendas aparecem

---

## 🔍 Verificação Detalhada

### Verificar Tabela de Migrations

```sql
psql -U admin -d erp_electrosal

-- Ver migrations aplicadas no schema erp
SELECT migration_name, finished_at
FROM erp."_prisma_migrations"
ORDER BY finished_at DESC
LIMIT 5;

-- Devem aparecer as mesmas migrations do public
SELECT migration_name, finished_at
FROM public."_prisma_migrations"
ORDER BY finished_at DESC
LIMIT 5;
```

### Verificar Foreign Keys

```sql
-- Listar foreign keys no schema erp
SELECT
    tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'erp'
LIMIT 20;
```

---

## ❌ Rollback (Se Algo Der Errado)

### Opção 1: Voltar para schema public

```bash
# Na VPS
cd /root/apps/sistema-erp-electrosal

# Editar ecosystem.config.js
nano ecosystem.config.js

# VOLTAR para:
DATABASE_URL: "postgresql://admin:Electrosal123@172.17.0.1:5432/erp_electrosal?schema=public",

# Reiniciar
pm2 reload ecosystem.config.js --env production --update-env
```

### Opção 2: Restaurar Backup

```bash
# SOMENTE SE NECESSÁRIO!

# Parar aplicações
pm2 stop all

# Dropar banco (CUIDADO!)
dropdb -U admin erp_electrosal

# Criar banco vazio
createdb -U admin erp_electrosal

# Restaurar backup
pg_restore -U admin -d erp_electrosal -v /root/backups/erp_electrosal_YYYYMMDD_HHMMSS.backup

# Reiniciar aplicações
pm2 reload ecosystem.config.js --env production
```

---

## 🗑️ Limpeza (Após Sucesso)

**SOMENTE APÓS** confirmar que tudo está funcionando com o schema `erp`:

```sql
-- Conectar ao banco
psql -U admin -d erp_electrosal

-- ⚠️ CUIDADO: Isso apaga TODAS as tabelas do schema public!
-- Certifique-se de que tem backup!

-- Opção 1: Apagar tabelas uma a uma (mais seguro)
DROP TABLE IF EXISTS public."User" CASCADE;
DROP TABLE IF EXISTS public."Organization" CASCADE;
-- ... etc

-- Opção 2: Apagar schema inteiro (PERIGOSO!)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

\q
```

**IMPORTANTE**: Não apague o schema `public` se o n8n ainda estiver usando!

---

## 📊 Checklist Final

- [ ] Backup completo realizado
- [ ] Backup copiado para máquina local
- [ ] Aplicações paradas (pm2 stop all)
- [ ] Script SQL executado sem erros
- [ ] Contagens de registros conferidas (public vs erp)
- [ ] DATABASE_URL atualizado no ecosystem.config.js
- [ ] Aplicações reiniciadas (pm2 reload)
- [ ] Health check do backend OK
- [ ] Frontend acessível
- [ ] Login funcionando
- [ ] Landing page carregando
- [ ] Manager funcionando
- [ ] Dados aparecendo corretamente
- [ ] Nenhum erro nos logs (pm2 logs)

---

## 🆘 Troubleshooting

### Erro: relation "erp.Tabela" does not exist

**Causa**: Schema erp não foi criado ou tabelas não foram copiadas.

**Solução**:
```bash
# Re-executar script
psql -U admin -d erp_electrosal -f scripts/migrate-to-erp-schema.sql
```

### Erro: duplicate key value violates unique constraint

**Causa**: Tentando inserir dados que já existem (executou script 2x).

**Solução**: Isso é OK! O script usa `ON CONFLICT DO NOTHING`, então duplicatas são ignoradas.

### Aplicação não conecta no banco

**Causa**: PM2 não recarregou as variáveis de ambiente.

**Solução**:
```bash
pm2 delete all
pm2 start ecosystem.config.js --env production
pm2 save
```

### n8n para de funcionar

**Causa**: n8n usa schema `public` e você apagou.

**Solução**: Não apague o schema public! Mantenha os dois schemas.

---

## 📝 Notas Importantes

1. **n8n e ERP podem coexistir**: O n8n usa suas próprias tabelas no schema `public`. O ERP usa o schema `erp`. Não há conflito.

2. **Migrations futuras**: Prisma vai aplicar migrations no schema configurado no DATABASE_URL. Se mudar para `schema=erp`, as próximas migrations vão para lá.

3. **Performance**: Não há diferença de performance entre schemas. É apenas organização lógica.

4. **Backup**: Sempre mantenha backups recentes. Esta é uma operação de mudança de estrutura.

---

**Criado em**: 2026-02-09
**Script**: scripts/migrate-to-erp-schema.sql
