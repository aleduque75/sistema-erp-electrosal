---
description: Guia Mestre de Manutenção e Configuração do ERP Electrosal (Landing Page, Mídia, n8n e Deploy)
---

# 🛠️ Skill: Gerenciamento Mestre ERP Electrosal

Este documento consolida todo o conhecimento técnico e procedimentos operacionais para a manutenção do ecossistema Electrosal.

## 1. Infraestrutura e Redes 🌐

### Mapeamento de Domínios (Nginx Proxy Manager)
- **https://erp.electrosal.com.br**: Painel administrativo (Frontend).
- **https://api.electrosal.com.br**: API Principal (Backend - Porta 3001).
- **https://n8n.electrosal.com.br**: Automação n8n (Porta 5678).
- **https://wa.electrosal.com.br**: Evolution API (Porta 8080).

> [!IMPORTANT]
> A Evolution API e o n8n devem estar na mesma rede Docker (`erp-network`) para permitir comunicação interna via `http://n8n:5678` ou `http://evolution_api:8080`, evitando latência e exposição desnecessária.

---

## 2. Biblioteca de Mídia e Imagens 🖼️

### Uploads e Permissões
- **Caminho Físico**: `/root/apps/sistema-erp-electrosal/apps/backend/uploads`.
- **Configuração**: O `MediaModule.ts` deve usar caminhos dinâmicos (`path.join(process.cwd(), 'uploads')`) para funcionar em qualquer servidor.
- **Acesso Público**: Imagens da Landing Page usam o endpoint `/api/public-media/[id]`.

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

### Comandos de Emergência
Se o deploy automático falhar:
// turbo
```bash
cd /root/apps/sistema-erp-electrosal
git pull origin main
pnpm install
pnpm --filter backend build
pnpm --filter frontend build
pm2 reload ecosystem.config.js --update-env
```

---

## 5. Landing Page Manager 🔧

### Sincronização SWR
O gerenciador usa a chave `public-landing-page-config` para invalidar o cache sempre que uma alteração é salva. Se os dados não atualizarem na Landing Page, verifique se o endpoint `GET /api/public/landing-page` está retornando o JSON atualizado do Prisma.
