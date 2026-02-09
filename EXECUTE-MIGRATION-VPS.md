## 🚀 EXECUTAR MIGRAÇÃO NA VPS - PASSO A PASSO

Este guia detalha **EXATAMENTE** como executar a migração para o schema `erp` na VPS.

---

## ⚠️ PRÉ-REQUISITOS

### 1. Backup (OBRIGATÓRIO!)

```bash
# SSH na VPS
ssh root@76.13.229.204

# Criar diretório de backup se não existir
mkdir -p /root/backups

# Fazer backup completo
pg_dump -U admin -d erp_electrosal -F c -b -v -f "/root/backups/erp_electrosal_$(date +%Y%m%d_%H%M%S).backup"

# Verificar tamanho do backup
ls -lh /root/backups/

# IMPORTANTE: Copiar para sua máquina local
# Em outro terminal (na sua máquina):
scp root@76.13.229.204:/root/backups/erp_electrosal_*.backup ~/backups/
```

### 2. Parar Aplicações

```bash
# Na VPS
pm2 stop all

# Confirmar que parou
pm2 status
```

---

## 📋 PASSO 1: LIMPAR SCHEMA ERP

```bash
# Conectar ao banco
psql -U admin -d erp_electrosal

# Limpar schema erp (se existir)
DROP SCHEMA IF EXISTS erp CASCADE;

# Criar schema erp limpo
CREATE SCHEMA erp;

# Sair
\q
```

---

## 📋 PASSO 2: ATUALIZAR DATABASE_URL TEMPORARIAMENTE

```bash
# Na VPS
cd /root/apps/sistema-erp-electrosal

# Fazer backup do ecosystem.config.js
cp ecosystem.config.js ecosystem.config.js.backup

# Editar ecosystem.config.js
nano ecosystem.config.js

# ENCONTRE a linha (aproximadamente linha 35):
DATABASE_URL: "postgresql://admin:Electrosal123@172.17.0.1:5432/erp_electrosal?schema=public",

# ALTERE PARA:
DATABASE_URL: "postgresql://admin:Electrosal123@172.17.0.1:5432/erp_electrosal?schema=erp",

# Salvar: Ctrl+O, Enter
# Sair: Ctrl+X
```

---

## 📋 PASSO 3: SINCRONIZAR ESTRUTURA COM PRISMA

```bash
# Na VPS
cd /root/apps/sistema-erp-electrosal/apps/backend

# Opção 1: Usar migrate deploy (RECOMENDADO)
npx prisma migrate deploy

# OU Opção 2: Se migrate deploy falhar, usar db push
# npx prisma db push --accept-data-loss

# Gerar client
npx prisma generate

# Voltar para raiz
cd ../..
```

**O que aconteceu**: Prisma criou todas as tabelas **VAZIAS** no schema `erp` com os tipos corretos (enums, etc).

---

## 📋 PASSO 4: FAZER PULL DO CÓDIGO ATUALIZADO

```bash
# Na VPS
cd /root/apps/sistema-erp-electrosal

# Fazer pull do GitHub (para pegar o script v2)
git pull origin main

# Verificar que o script existe
ls -la scripts/migrate-to-erp-schema-v2.sql
```

---

## 📋 PASSO 5: EXECUTAR MIGRAÇÃO DE DADOS

```bash
# Na VPS
cd /root/apps/sistema-erp-electrosal

# Executar script de migração v2
psql -U admin -d erp_electrosal -f scripts/migrate-to-erp-schema-v2.sql

# Esse comando vai:
# - Copiar dados de public para erp
# - Fazer cast de tipos (enums)
# - Respeitar ordem de dependências
# - Mostrar verificação ao final
```

**IMPORTANTE**: Preste atenção na saída! Deve mostrar:
- ✅ Cada INSERT completado
- ✅ Contagem de registros no final
- ❌ Se houver erros, anote-os

---

## 📋 PASSO 6: VERIFICAR DADOS COPIADOS

```bash
# Conectar ao banco
psql -U admin -d erp_electrosal

-- Verificar tabelas criadas
\dt erp.*

-- Comparar contagens (deve ser igual!)
SELECT
  'public' as schema,
  (SELECT COUNT(*) FROM public."User") as users,
  (SELECT COUNT(*) FROM public."Organization") as orgs,
  (SELECT COUNT(*) FROM public."LandingPage") as landing_pages,
  (SELECT COUNT(*) FROM public."Section") as sections,
  (SELECT COUNT(*) FROM public."Media") as media,
  (SELECT COUNT(*) FROM public."Product") as products;

SELECT
  'erp' as schema,
  (SELECT COUNT(*) FROM erp."User") as users,
  (SELECT COUNT(*) FROM erp."Organization") as orgs,
  (SELECT COUNT(*) FROM erp."LandingPage") as landing_pages,
  (SELECT COUNT(*) FROM erp."Section") as sections,
  (SELECT COUNT(*) FROM erp."Media") as media,
  (SELECT COUNT(*) FROM erp."Product") as products;

-- Sair
\q
```

**✅ OS NÚMEROS DEVEM SER IGUAIS!**

Se não forem iguais:
1. Anote quais tabelas têm diferença
2. Não continue, vamos investigar o erro

---

## 📋 PASSO 7: REINICIAR APLICAÇÕES

```bash
# Na VPS
cd /root/apps/sistema-erp-electrosal

# Reload PM2 com novo DATABASE_URL
pm2 reload ecosystem.config.js --env production --update-env

# Salvar configuração
pm2 save

# Ver status
pm2 status

# Ver logs (buscar por erros)
pm2 logs --lines 50
```

---

## 📋 PASSO 8: TESTAR SISTEMA

### Backend

```bash
# Na VPS
curl http://localhost:3001/api/health

# Deve retornar:
# {"status":"ok"}
```

### Frontend

```bash
curl -I http://localhost:3000

# Deve retornar:
# HTTP/1.1 200 OK
```

### No Navegador

Acesse:
- ✅ https://electrosal.com.br
- ✅ https://electrosal.com.br/landing-page-manager

Teste:
- ✅ Login funciona
- ✅ Landing page carrega
- ✅ Manager carrega
- ✅ Biblioteca de mídia mostra imagens
- ✅ Produtos aparecem (se tiver)
- ✅ Nenhum erro no console do navegador

---

## 🔴 SE ALGO DER ERRADO - ROLLBACK

### Opção 1: Voltar para schema public

```bash
# Na VPS
cd /root/apps/sistema-erp-electrosal

# Restaurar backup do ecosystem.config.js
cp ecosystem.config.js.backup ecosystem.config.js

# OU editar manualmente:
nano ecosystem.config.js
# Mudar de schema=erp para schema=public

# Reiniciar
pm2 reload ecosystem.config.js --env production --update-env
```

### Opção 2: Restaurar backup completo (última opção!)

```bash
# SOMENTE SE NECESSÁRIO!

# Parar aplicações
pm2 stop all

# Dropar banco
dropdb -U admin erp_electrosal

# Criar banco vazio
createdb -U admin erp_electrosal

# Restaurar backup
pg_restore -U admin -d erp_electrosal -v /root/backups/erp_electrosal_YYYYMMDD_HHMMSS.backup

# Voltar ecosystem.config.js para schema=public
nano ecosystem.config.js

# Reiniciar
pm2 reload ecosystem.config.js --env production
```

---

## 📊 CHECKLIST DE VERIFICAÇÃO

Execute após a migração:

- [ ] Backup completo realizado
- [ ] Backup copiado para máquina local
- [ ] Schema erp limpo (DROP/CREATE)
- [ ] DATABASE_URL atualizado para schema=erp
- [ ] `prisma migrate deploy` executado sem erros
- [ ] Script v2 executado sem erros
- [ ] Contagens de registros conferidas (public = erp)
- [ ] PM2 reiniciado com sucesso
- [ ] Backend health check OK
- [ ] Frontend acessível
- [ ] Login funciona
- [ ] Landing page carrega
- [ ] Manager funciona
- [ ] Biblioteca de mídia mostra imagens
- [ ] Nenhum erro nos logs

---

## 🐛 TROUBLESHOOTING

### Erro: "relation erp.User does not exist"

**Causa**: Prisma não criou as tabelas no schema erp.

**Solução**:
```bash
cd /root/apps/sistema-erp-electrosal/apps/backend
npx prisma db push --accept-data-loss
npx prisma generate
```

### Erro: "invalid input syntax for type erp.Role"

**Causa**: Enum não existe no schema erp ou valor incompatível.

**Solução**: Verifique os valores dos enums no schema.prisma e ajuste o cast no script SQL.

### Erro: "violates foreign key constraint"

**Causa**: Ordem de inserção incorreta.

**Solução**: O script v2 já está ordenado corretamente. Se ainda assim falhar:
1. Verifique se todas as tabelas independentes foram copiadas primeiro
2. Execute o script novamente (usa ON CONFLICT DO NOTHING)

### Aplicação não inicia após migração

**Logs para verificar**:
```bash
pm2 logs erp-backend --lines 100
pm2 logs erp-frontend --lines 100
```

**Possíveis causas**:
1. DATABASE_URL ainda aponta para schema=public
2. Prisma Client não foi regenerado
3. Tabelas não foram criadas no schema erp

---

## ✅ SUCESSO!

Se tudo funcionou:

1. **Aplicação rodando com schema erp** ✅
2. **Dados preservados** ✅
3. **n8n continua funcionando no schema public** ✅

**Próximo passo**: Após confirmar que tudo está OK por alguns dias, você pode considerar limpar o schema public (mas mantenha o backup!).

---

**Criado em**: 2026-02-09
**Versão**: 2.0 (com cast de tipos e ordem de dependências)
