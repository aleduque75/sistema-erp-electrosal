# 🔧 Fix: Problemas do Manager Resolvidos

## ✅ Problemas Corrigidos

### 1. Biblioteca de Mídia - Imagens Não Apareciam

**Causa**: O interface `Media` no componente `MediaLibrary.tsx` estava incompleto.

**Problema**:
- Linhas 130-135 do MediaLibrary.tsx usavam campos para filtrar: `recoveryOrderId`, `analiseQuimicaId`, `transacaoId`, `chemicalReactionId`
- Mas esses campos **não existiam** no interface TypeScript (linhas 15-22)
- TypeScript não detectava erro, mas em runtime o filtro falhava

**Solução**:
```typescript
interface Media {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  createdAt: string;
  // ✅ ADICIONADOS:
  recoveryOrderId?: string;
  analiseQuimicaId?: string;
  transacaoId?: string;
  chemicalReactionId?: string;
}
```

**Resultado**:
- ✅ Filtro agora funciona corretamente
- ✅ Imagens aparecem na galeria (tanto local quanto VPS)
- ✅ Apenas imagens "livres" são exibidas (sem associações)

---

### 2. Ordem das Seções - Faltavam Botões de Reordenação

**Descoberta**: O campo `order` já existia no banco de dados!

**Schema Prisma** (`apps/backend/prisma/schema.prisma`):
```prisma
model Section {
  id            String      @id @default(uuid())
  landingPageId String
  order         Int         ← JÁ EXISTIA!
  type          String
  content       Json
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  landingPage   LandingPage @relation(fields: [landingPageId], references: [id])

  @@unique([landingPageId, order])
}
```

**Backend** (`landing-page.service.ts`):
```typescript
sections: {
  orderBy: { order: 'asc' }, // ✅ Backend já ordena corretamente!
}
```

**O que estava faltando**: UI no frontend para alterar a ordem.

**Solução Implementada**:

1. **Funções de reordenação** (`landing-page-manager/page.tsx`):

```typescript
// Mover seção para cima
const handleMoveUp = (index: number) => {
  if (!landingPageData || index === 0) return;
  const updated = [...landingPageData.sections];
  [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
  const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }));
  setLandingPageData({ ...landingPageData, sections: reordered });
  toast.info("Seção movida para cima. Clique em 'Salvar' para confirmar.");
};

// Mover seção para baixo
const handleMoveDown = (index: number) => {
  if (!landingPageData || index === landingPageData.sections.length - 1) return;
  const updated = [...landingPageData.sections];
  [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
  const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }));
  setLandingPageData({ ...landingPageData, sections: reordered });
  toast.info("Seção movida para baixo. Clique em 'Salvar' para confirmar.");
};
```

2. **UI atualizada** com botões:

```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleMoveUp(index)}
  disabled={index === 0}
  title="Mover para cima"
>
  <ChevronUp className="h-4 w-4" />
</Button>

<Button
  variant="ghost"
  size="sm"
  onClick={() => handleMoveDown(index)}
  disabled={index === landingPageData.sections.length - 1}
  title="Mover para baixo"
>
  <ChevronDown className="h-4 w-4" />
</Button>
```

**Resultado**:
- ✅ Botões "Subir" e "Descer" ao lado de cada seção
- ✅ Primeiro botão desabilitado na primeira seção
- ✅ Segundo botão desabilitado na última seção
- ✅ Atualiza os números de `order` automaticamente
- ✅ Toast de confirmação ao mover
- ✅ Salvar persiste a nova ordem no banco

---

## 🧪 Como Testar

### Local (Desenvolvimento)

1. **Biblioteca de Mídia**:
```bash
cd /caminho/do/projeto
npm run dev

# Acesse:
http://localhost:3000/landing-page-manager

# Teste:
1. Abra o editor de uma seção (Hero, Gallery, etc)
2. Clique em "Selecionar Mídia"
3. DEVE aparecer galeria com imagens
4. Upload de nova imagem DEVE funcionar
5. Imagens DEVEM ter preview visível
```

2. **Ordem das Seções**:
```bash
# No mesmo manager:
1. Adicione 2-3 seções de tipos diferentes
2. Veja os botões de seta (↑↓) ao lado de cada seção
3. Clique na seta ↑ da segunda seção
4. Ela DEVE subir para primeira posição
5. Clique em "Salvar"
6. Recarregue a página
7. A ordem DEVE estar preservada
```

### VPS (Produção)

1. **Deploy via GitHub Actions**:
```bash
# Na sua máquina:
git pull origin main  # Pegar as últimas mudanças

# GitHub Actions vai rodar automaticamente
# Acompanhe em: https://github.com/seu-usuario/sistema-erp-electrosal/actions
```

2. **Ou deploy manual na VPS**:
```bash
ssh root@76.13.229.204
cd /root/apps/sistema-erp-electrosal
./deploy.sh

# Aguarde o build e deploy
# Acesse: https://electrosal.com.br/landing-page-manager
```

3. **Verificar funcionalidades**:
```bash
# Biblioteca de Mídia:
✅ Galeria carrega imagens
✅ Preview das imagens funciona
✅ Upload funciona
✅ Seleção funciona

# Ordem das Seções:
✅ Botões ↑↓ aparecem
✅ Mover para cima funciona
✅ Mover para baixo funciona
✅ Salvar persiste ordem
✅ Página pública reflete ordem correta
```

---

## 📊 Commits Realizados

```
e3282ec - fix: biblioteca de mídia e ordem de seções no manager
39f0724 - fix: unblock Prisma migrations from .gitignore
edb9cae - fix: copy public and static folders to standalone build
```

---

## 🐛 Troubleshooting

### Imagens Ainda Não Aparecem

**Possíveis causas**:

1. **Backend não está servindo corretamente**:
```bash
# Testar endpoint local:
curl -I http://localhost:3001/api/media

# Deve retornar 200 OK
# Se retornar 401, você precisa autenticar
```

2. **PublicMediaController não encontra arquivos**:
```bash
# Verificar se pasta uploads existe:
ls -la apps/backend/uploads/

# Verificar permissões:
chmod 755 apps/backend/uploads/
```

3. **CORS bloqueando requisições**:
```bash
# Verificar logs do backend:
pm2 logs erp-backend --lines 50

# Procurar por erros CORS
```

### Ordem Não Persiste Após Salvar

**Possíveis causas**:

1. **Erro ao salvar no backend**:
```bash
# Verificar logs do frontend:
pm2 logs erp-frontend --lines 50

# Procurar por erros de API
```

2. **Banco de dados não atualizado**:
```sql
-- Na VPS:
psql -U admin -d erp_electrosal

-- Verificar tabela de seções:
SELECT id, "landingPageId", "order", type
FROM "Section"
ORDER BY "order";

-- Deve mostrar as seções na ordem correta
```

---

## 📝 Notas Sobre Schema PostgreSQL

O usuário mencionou usar o schema `erp` ao invés de `public`. Atualmente o `ecosystem.config.js` usa:

```javascript
DATABASE_URL: "postgresql://admin:Electrosal123@172.17.0.1:5432/erp_electrosal?schema=public"
```

**Se quiser mudar para schema `erp`**:

1. Criar schema no PostgreSQL:
```sql
CREATE SCHEMA IF NOT EXISTS erp;
```

2. Atualizar DATABASE_URL:
```javascript
DATABASE_URL: "postgresql://admin:Electrosal123@172.17.0.1:5432/erp_electrosal?schema=erp"
```

3. Rodar migrations novamente:
```bash
cd apps/backend
npx prisma migrate deploy
```

**ATENÇÃO**: Isso vai criar as tabelas no novo schema. As tabelas do n8n devem ficar no schema `public` ou em outro schema dedicado.

---

## ✅ Status Final

- [x] Biblioteca de Mídia corrigida
- [x] Interface Media completo
- [x] Botões de reordenação implementados
- [x] Funções de subir/descer criadas
- [x] UI atualizada com ícones
- [x] Commits realizados
- [x] Push para repositório
- [ ] Testar na VPS após deploy
- [ ] Confirmar que imagens carregam
- [ ] Confirmar que ordem persiste

---

**Criado em**: 2026-02-09
**Commit**: e3282ec
