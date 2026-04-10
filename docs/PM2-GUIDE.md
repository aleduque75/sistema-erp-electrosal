# 🚀 Guia PM2 - Electrosal ERP

## 📋 Comandos Essenciais

### Desenvolvimento (localhost)

```bash
# Iniciar aplicações em modo desenvolvimento
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs
pm2 logs
pm2 logs erp-backend
pm2 logs erp-frontend

# Parar tudo
pm2 stop all

# Reiniciar
pm2 restart all
```

---

### Produção (VPS Hostinger)

```bash
# Iniciar aplicações em modo PRODUÇÃO
pm2 start ecosystem.config.js --env production

# Recarregar após deploy (sem downtime)
pm2 reload ecosystem.config.js --env production

# Verificar status
pm2 status

# Ver logs em tempo real
pm2 logs --lines 100

# Monitoramento
pm2 monit
```

---

## 🔧 Configuração na VPS

### 1. Após fazer Pull do Repositório

```bash
cd /var/www/electrosal  # ou seu diretório

# Pull do código
git pull origin main

# Instalar dependências
npm install

# Backend: Gerar Prisma Client
cd apps/backend
npx prisma generate
cd ../..

# Build ambas aplicações
npm run build
```

---

### 2. Iniciar com PM2

```bash
# Parar processos antigos (se existirem)
pm2 delete all

# Iniciar em produção
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save

# Configurar auto-start no boot
pm2 startup
# Copie e execute o comando que aparecer
```

---

## 🐛 Troubleshooting

### Frontend não conecta na API

**Problema:** URLs duplicadas (api.electrosal.com.br/api/api)

**Solução:** Verificar `ecosystem.config.js`

```javascript
// ✅ CORRETO (lib/api.ts adiciona /api automaticamente)
NEXT_PUBLIC_API_URL: "https://api.electrosal.com.br"

// ❌ ERRADO (vai duplicar!)
NEXT_PUBLIC_API_URL: "https://api.electrosal.com.br/api"
```

---

### Backend não conecta no banco

**Problema:** IP do Docker incorreto

**Solução:** Usar IP da bridge do Docker

```javascript
// ✅ CORRETO
DATABASE_URL: "postgresql://admin:senha@172.17.0.1:5432/erp_electrosal?schema=public"

// ❌ Se não funcionar, testar:
DATABASE_URL: "postgresql://admin:senha@localhost:5432/erp_electrosal?schema=public"
```

---

### Classificação de OFX não funciona

**Problema:** Ollama não está acessível

**Solução:** Verificar se Ollama está rodando

```bash
# Verificar Ollama
curl http://localhost:11434/api/generate

# Se não responder, reiniciar Ollama
systemctl restart ollama  # ou docker restart ollama
```

---

## 📊 Logs e Monitoramento

### Localização dos Logs

```
./logs/backend-error.log   # Erros do backend
./logs/backend-out.log      # Output do backend
./logs/frontend-error.log   # Erros do frontend
./logs/frontend-out.log     # Output do frontend
```

### Ver logs específicos

```bash
# Últimas 100 linhas do backend
tail -100 logs/backend-error.log

# Acompanhar logs em tempo real
tail -f logs/backend-out.log

# PM2 logs
pm2 logs erp-backend --lines 50
```

---

## 🔄 Fluxo de Deploy Completo

### Na VPS Hostinger:

```bash
# 1. Navegue para o diretório do projeto
cd /var/www/electrosal

# 2. Pull do código
git pull origin main

# 3. Instalar dependências
npm install

# 4. Backend: Gerar Prisma Client
cd apps/backend
npx prisma generate
cd ../..

# 5. Build
npm run build

# 6. Recarregar PM2 (sem downtime)
pm2 reload ecosystem.config.js --env production

# 7. Verificar status
pm2 status

# 8. Ver logs
pm2 logs --lines 50
```

---

## ⚙️ Variáveis Importantes

### Backend (`env_production`)

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `DATABASE_URL` | `postgresql://admin:senha@172.17.0.1:5432/erp_electrosal` | Banco PostgreSQL |
| `JWT_SECRET` | String forte | Chave secreta JWT |
| `PORT` | `3001` | Porta do backend |
| `AI_ENDPOINT` | `http://localhost:11434/api/generate` | Ollama para OFX |

### Frontend (`env_production`)

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NEXT_PUBLIC_API_URL` | `https://api.electrosal.com.br` | URL da API (SEM /api no final!) |
| `PORT` | `3000` | Porta do frontend |

---

## 🎯 Checklist de Verificação

Após deploy, verificar:

- [ ] `pm2 status` - Ambos apps rodando
- [ ] `curl http://localhost:3001/api/health` - Backend responde
- [ ] `curl http://localhost:3000` - Frontend responde
- [ ] https://api.electrosal.com.br/api/health - Público funcionando
- [ ] https://electrosal.com.br - Site acessível
- [ ] Login funcionando
- [ ] Imagens carregando
- [ ] Editor da Landing Page salvando

---

## 📞 Comandos Úteis PM2

```bash
# Informações detalhadas
pm2 info erp-backend

# Reiniciar apenas backend
pm2 restart erp-backend

# Reiniciar apenas frontend
pm2 restart erp-frontend

# Deletar e recriar
pm2 delete all
pm2 start ecosystem.config.js --env production

# Dashboard web
pm2 plus  # Cadastre no PM2 Plus para dashboard
```

---

## 🆘 Suporte

Se algo der errado:

1. Verificar logs: `pm2 logs`
2. Verificar status: `pm2 status`
3. Verificar Nginx: `sudo nginx -t`
4. Verificar PostgreSQL: `docker ps`
5. Verificar Ollama: `curl localhost:11434`
