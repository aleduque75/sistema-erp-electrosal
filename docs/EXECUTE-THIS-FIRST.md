# 🔍 EXECUTE ESTE COMANDO NA VPS E ME MOSTRE O RESULTADO

Preciso ver a estrutura real das tabelas no schema `erp` para criar o script de migração correto.

## Passo 1: SSH na VPS

```bash
ssh root@76.13.229.204
cd /root/apps/sistema-erp-electrosal
```

## Passo 2: Fazer pull do código

```bash
git pull origin main
```

## Passo 3: Executar script de verificação

```bash
psql -U admin -d erp_electrosal -f scripts/check-erp-schema-structure.sql
```

## Passo 4: Copie TODA a saída

Copie TODA a saída do comando acima e me envie. Eu preciso ver:

- ✅ Nomes exatos das colunas de Media
- ✅ Nomes exatos das colunas de LandingPage
- ✅ Nomes exatos das colunas de Section
- ✅ Nomes exatos das colunas de Product
- ✅ Nomes exatos das colunas de Sale
- ✅ Nomes exatos das colunas de Organization
- ✅ Nomes exatos das colunas de User

## Exemplo do que vou receber:

```
 column_name          | data_type | is_nullable
----------------------+-----------+-------------
 id                   | uuid      | NO
 filename             | text      | NO
 mimetype             | text      | NO
 size                 | integer   | NO
 path                 | text      | NO
 createdAt            | timestamp | NO
 updatedAt            | timestamp | NO
 organizationId       | uuid      | YES
 height               | integer   | YES
 width                | integer   | YES
 recoveryOrderId      | uuid      | YES      ← OU recovery_order_id?
 analiseQuimicaId     | uuid      | YES      ← OU analise_quimica_id?
 transacaoId          | uuid      | YES      ← OU transacao_id?
 chemicalReactionId   | uuid      | YES      ← OU chemical_reaction_id?
```

Assim eu saberei se o Prisma está usando **camelCase** (`recoveryOrderId`) ou **snake_case** (`recovery_order_id`).

## Passo 5: Me envie a saída completa

Cole toda a saída aqui para eu criar o script de migração correto!
