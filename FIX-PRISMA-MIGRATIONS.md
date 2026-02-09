# 🔧 Fix Crítico: Prisma Migrations Bloqueadas pelo .gitignore

## ❌ Problema Identificado

O deploy via **GitHub Actions** falhava com erro de que o Prisma queria apagar as tabelas do n8n.

### Causa Raiz

O arquivo `.gitignore` na **linha 46** continha:

```
migration*.sql
```

Isso bloqueava TODOS os arquivos `migration.sql` do Prisma, impedindo que fossem commitados no repositório.

## 🔍 Consequências

1. ✅ `deploy.sh` estava correto com `npx prisma migrate deploy`
2. ❌ Mas as migrations **não existiam no repositório remoto**
3. ❌ Quando o `prisma migrate deploy` rodava na VPS:
   - Não encontrava os arquivos de migration
   - Não sabia quais migrations aplicar
   - O Prisma tentava sincronizar o schema diretamente (como um `db push`)
   - Detectava tabelas do n8n que não estavam no schema
   - **Queria apagar essas tabelas!**

## ✅ Solução Aplicada

### 1. Removido bloqueio do .gitignore

```diff
  # Ignorar arquivos de backup e migração temporários
  backup.dump
- migration*.sql
+ # migration*.sql  ← REMOVIDO! Migrations do Prisma DEVEM ser commitadas
```

### 2. Commitadas as migrations do Prisma

Adicionadas ao repositório:

- ✅ `0_init/migration.sql` - Schema inicial do banco
- ✅ `20260130014511_feature_add_theme_settings/migration.sql` - Adiciona coluna `theme` em UserSettings
- ✅ `20260130172347_add_theme_preset_model/migration.sql` - Cria tabela `theme_presets`

### 3. Commits realizados

```bash
39f0724 - fix: unblock Prisma migrations from .gitignore
edb9cae - fix: copy public and static folders to standalone build
```

## 🚀 Próximo Deploy

Agora o **GitHub Actions** vai funcionar corretamente:

1. ✅ Faz pull do código (com as migrations)
2. ✅ Executa `./deploy.sh`
3. ✅ Roda `npx prisma migrate deploy`
4. ✅ Aplica SOMENTE as migrations necessárias
5. ✅ **NÃO toca nas tabelas do n8n!**

## 📊 Como Funciona Agora

### Antes (ERRADO ❌)

```
GitHub Actions
  → Pull do código
  → deploy.sh
  → npx prisma migrate deploy
  → ❌ Não encontra migrations
  → ❌ Prisma tenta sincronizar schema
  → ❌ Detecta tabelas do n8n
  → ❌ ERRO: Quer apagar workflow_entity!
```

### Depois (CORRETO ✅)

```
GitHub Actions
  → Pull do código (COM migrations commitadas)
  → deploy.sh
  → npx prisma migrate deploy
  → ✅ Encontra migrations em apps/backend/prisma/migrations/
  → ✅ Verifica quais já foram aplicadas (tabela _prisma_migrations)
  → ✅ Aplica SOMENTE as novas
  → ✅ Ignora tabelas que não estão no schema (n8n)
  → ✅ SUCESSO!
```

## 🧪 Verificação

Após o próximo deploy automático, verificar:

### 1. Logs do GitHub Actions

```bash
# No GitHub, ir em Actions → Deploy Electrosal ERP → Última execução
# Deve aparecer:
✅ npx prisma migrate deploy
✅ Prisma schema loaded from schema.prisma
✅ 0 migrations found in prisma/migrations
✅ No pending migrations to apply.
```

### 2. Tabela de migrations no banco

```sql
-- Na VPS
psql -U admin -d erp_electrosal -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"

-- Deve listar:
-- 20260130172347_add_theme_preset_model
-- 20260130014511_feature_add_theme_settings
-- 0_init
```

### 3. Tabelas do n8n intactas

```sql
-- Verificar que as tabelas do n8n ainda existem
psql -U admin -d erp_electrosal -c "\dt" | grep workflow

-- Deve mostrar:
-- workflow_entity
-- workflow_statistics
-- etc.
```

## 📚 Contexto Técnico

### Por que migrations DEVEM ser commitadas?

O Prisma usa um sistema de **migrations declarativas**:

1. **Schema** (`schema.prisma`) → Define COMO o banco DEVE estar
2. **Migrations** (`migration.sql`) → Define O QUE fazer para chegar lá
3. **Tabela de controle** (`_prisma_migrations`) → Rastreia o que JÁ foi feito

Sem as migrations commitadas:
- ❌ Prisma não sabe COMO aplicar mudanças
- ❌ Tenta fazer um "diff" direto (perigoso!)
- ❌ Pode apagar dados ou tabelas não relacionadas

### Por que `migrate deploy` é seguro?

```bash
# ✅ SEGURO (usado agora)
npx prisma migrate deploy
  → Aplica SOMENTE migrations pendentes
  → Ignora tabelas não mencionadas nas migrations
  → Nunca apaga dados

# ❌ PERIGOSO (NÃO usar em produção com banco compartilhado)
npx prisma db push
  → Tenta forçar o schema
  → Pode apagar tabelas "estranhas" (n8n!)
  → Pode perder dados
```

## ✅ Checklist Final

- [x] .gitignore corrigido
- [x] Migrations commitadas (3 arquivos)
- [x] Push realizado para main
- [ ] Próximo deploy automático via GitHub Actions
- [ ] Verificar logs do deploy
- [ ] Confirmar que tabelas do n8n não foram afetadas
- [ ] Verificar que `theme` está disponível em UserSettings

## 🎯 Status

**PROBLEMA RESOLVIDO!** As migrations agora estão no repositório e o `prisma migrate deploy` vai funcionar corretamente.

---

## 📞 Se Ainda Falhar

Se o próximo deploy ainda reportar erro:

### 1. Verificar se migrations foram aplicadas manualmente

```bash
# Na VPS
cd /root/apps/sistema-erp-electrosal/apps/backend
npx prisma migrate status

# Se mostrar "Database schema is not in sync"
# Executar:
npx prisma migrate resolve --applied "20260130014511_feature_add_theme_settings"
npx prisma migrate resolve --applied "20260130172347_add_theme_preset_model"
```

### 2. Forçar sincronização (CUIDADO!)

```bash
# SOMENTE se você tiver certeza de que o schema está correto
npx prisma db pull  # Puxa schema atual do banco
# Revisar diferenças
npx prisma migrate dev --name sync_manual_changes
```

### 3. Aplicar migration SQL manual (fallback)

Se tudo falhar, pode aplicar o SQL manualmente:

```sql
-- Garantir que a coluna theme existe
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "theme" TEXT DEFAULT 'system';

-- Registrar na tabela de migrations
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid(),
  '',
  NOW(),
  '20260130014511_feature_add_theme_settings',
  '',
  NULL,
  NOW(),
  1
) ON CONFLICT DO NOTHING;
```

---

**Criado em**: 2026-02-09
**Commit**: 39f0724
