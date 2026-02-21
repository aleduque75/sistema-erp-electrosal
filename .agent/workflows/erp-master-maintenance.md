---
description: Guia Mestre de Manutenção e Configuração do ERP Electrosal (Landing Page, Mídia, n8n e Deploy)
---

# 🛠️ Skill: Gerenciamento Mestre ERP Electrosal

Este documento consolida todo o conhecimento técnico e procedimentos operacionais para a manutenção do ecossistema Electrosal.

## 1. Infraestrutura e Redes 🌐

### Mapeamento de Domínios (Nginx Proxy Manager)
- **https://erp.electrosal.com.br**: Painel administrativo principal.
- **https://api.electrosal.com.br**: API Principal (Produção - Porta 3001).
- **https://dev-erp.electrosal.com.br**: Ambiente de Homologação (Porta 4000).
- **https://dev-api.electrosal.com.br**: API de Homologação (Porta 4001).
- **https://n8n.electrosal.com.br**: Automação n8n (Porta 5678).
- **https://wa.electrosal.com.br**: Evolution API (Porta 8080).

> [!IMPORTANT]
> A Evolution API e o n8n devem estar na mesma rede Docker (`erp-network`) para permitir comunicação interna via `http://n8n:5678` ou `http://evolution_api:8080`, evitando latência e exposição desnecessária.

---

## 2. Biblioteca de Mídia e Imagens 🖼️

### Uploads e Permissões
- **Produção**: `/root/apps/sistema-erp-electrosal/apps/backend/uploads`.
- **Homologação**: `/root/apps/homolog-erp/apps/backend/uploads`.
- **Configuração**: O `MediaModule.ts` deve usar caminhos dinâmicos (`path.join(process.cwd(), 'uploads')`).
- **Acesso Público/Autenticado**: Imagens usam o endpoint `/api/media/public-media/[id]`. O serviço retorna a URL completa no campo `url` da entidade.

### Heros e Banners
Os componentes `HeroSection.tsx` e `HeroNew.tsx` no frontend devem usar URLs relativas (`/api/public-media/`) para carregar imagens tanto em homologação quanto em produção sem erro de `localhost`.

---

## 3. Integração n8n e Webhooks 🤖

### Estrutura do Payload (Contato)
Para garantir compatibilidade com as fórmulas de notificação de WhatsApp, o frontend envia um payload **híbrido**:

```json
{
  "nome": "João",
  "whatsapp": "5511999999999",
  "phone": "5511999999999",
  "number": "5511999999999",
  "body": {
    "whatsapp": "5511999999999",
    ...
  }
}
```

- **Por que?**: O n8n do usuário espera o campo `body.whatsapp`. A Evolution API espera `number`. O payload acima atende a ambos.
- **Dica**: No n8n, se der `undefined`, use `{{ $('Webhook').item.json.body.whatsapp }}` para pegar o dado direto da origem.

---

## 4. Fluxo de Deploy Automatizado (CI/CD) 🚀

### Arquivos Críticos
1. **.github/workflows/deploy.yml**: Dispara o script via SSH ao dar push na `main`.
2. **deploy.sh**: Automatiza o `git pull`, `pnpm install`, `build` e `pm2 reload`.
3. **ecosystem.config.js**: Gerencia os processos do PM2. Deve usar caminhos relativos ao `cwd`.

### Comandos de Emergência (Tela Branca / Conflito de Porta)
Se o sistema ficar fora do ar ou apresentar erro de renderização:

// turbo
```bash
# 1. Matar processos órfãos nas portas críticas
fuser -k 3000/tcp 3001/tcp 4000/tcp 4001/tcp

# 2. Homologação (Portas 4000/4001)
cd /root/apps/homolog-erp
rm -rf apps/frontend/.next
pnpm build
pm2 delete erp-backend-homolog erp-frontend-homolog
pm2 start apps/backend/dist/main.js --name erp-backend-homolog
pm2 start "pnpm --cwd apps/frontend next start -p 4000" --name erp-frontend-homolog

# 3. Produção (Portas 3000/3001)
cd /root/apps/sistema-erp-electrosal
pm2 delete erp-backend erp-frontend
pm2 start apps/backend/dist/main.js --name erp-backend
pm2 start "pnpm --cwd apps/frontend next start -p 3000" --name erp-frontend
```

---

## 5. Padronização Mobile e Modais 📱

### Padrão Drawer/Dialog
Para compatibilidade com o **S23**, seguimos a regra:
- **Desktop (>= 768px)**: Renderiza componentes via `Dialog`.
- **Mobile (< 768px)**: Renderiza componentes via `Drawer` (Vaul) ocupando 100% da altura para melhor usabilidade.

### Tabelas de Dados
- Colunas críticas devem ter largura fixa.
- Usar `DropdownMenu` com ícones grandes para ações em mobile.
- Sempre incluir **Seleção em Lote** para facilitar operações repetitivas.

---

## 6. Módulo de Análises Químicas 🧪

### Galeria de Imagens
- O frontend deve consumir preferencialmente o campo `url` retornado pelo backend.
- Fallback: `API_BASE_URL + item.path`.
- O componente `ImageGallery.tsx` é o padrão para exibição e exclusão.

### PDF de Análise
- Gerado via endpoint `/api/analises-quimicas/[id]/pdf` como `blob`.
- Botão "Imprimir PDF" deve estar presente no cabeçalho (Desktop) e rodapé (Mobile).

---

## 5. Landing Page Manager 🔧

### Sincronização SWR
O gerenciador usa a chave `public-landing-page-config` para invalidar o cache sempre que uma alteração é salva. Se os dados não atualizarem na Landing Page, verifique se o endpoint `GET /api/public/landing-page` está retornando o JSON atualizado do Prisma.
