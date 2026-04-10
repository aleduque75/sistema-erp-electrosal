# 🚀 Guia de Deploy - VPS Hostinger

## 📋 Checklist Pré-Deploy

### 1. Variáveis de Ambiente

#### Frontend (.env.local ou variáveis do servidor)
```bash
NEXT_PUBLIC_API_URL=https://api.electrosal.com.br
```

#### Backend (.env)
```bash
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@host:porta/banco?schema=public"

# JWT
JWT_SECRET="sua_chave_secreta_forte"

# Organization
DEFAULT_ORGANIZATION_ID="uuid-da-organizacao"

# APIs Externas
EVOLUTION_API_KEY="sua_key"
EVOLUTION_INSTANCE_TOKEN="seu_token"
```

---

## 🔧 Configurações Importantes

### Next.js - Domínios de Imagem Permitidos

O arquivo `apps/frontend/next.config.mjs` já está configurado para:

✅ **Desenvolvimento:**
- `http://localhost:3001`

✅ **Produção:**
- `https://api.electrosal.com.br`
- `https://electrosal.com.br`
- `https://76.13.229.204` (IP direto, se necessário)

---

## 📦 Build e Deploy

### Backend (NestJS)

```bash
cd apps/backend

# 1. Instalar dependências
npm install

# 2. Gerar Prisma Client
npx prisma generate

# 3. Sincronizar banco (primeira vez)
npx prisma db push

# 4. Build
npm run build

# 5. Iniciar em produção
npm run start:prod
```

**Porta padrão:** 3001

---

### Frontend (Next.js)

```bash
cd apps/frontend

# 1. Instalar dependências
npm install

# 2. Build
npm run build

# 3. Iniciar em produção
npm start
```

**Porta padrão:** 3000

---

## 🌐 Nginx Configuration (Exemplo)

```nginx
# Backend API
server {
    listen 80;
    server_name api.electrosal.com.br;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name electrosal.com.br www.electrosal.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔒 SSL/HTTPS com Certbot

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Gerar certificados
sudo certbot --nginx -d api.electrosal.com.br
sudo certbot --nginx -d electrosal.com.br -d www.electrosal.com.br

# Renovação automática
sudo certbot renew --dry-run
```

---

## 🔄 PM2 para Process Management

```bash
# Instalar PM2
npm install -g pm2

# Backend
cd apps/backend
pm2 start dist/main.js --name "electrosal-backend"

# Frontend
cd apps/frontend
pm2 start npm --name "electrosal-frontend" -- start

# Salvar configuração
pm2 save

# Auto-start no boot
pm2 startup
```

---

## 📊 Verificação de Deploy

### 1. Backend Health Check
```bash
curl https://api.electrosal.com.br/api/health
```

### 2. Frontend
```bash
curl https://electrosal.com.br
```

### 3. Imagens
```bash
curl -I https://api.electrosal.com.br/api/public-media/[UUID]
```

---

## 🐛 Troubleshooting

### Imagens não aparecem
- Verifique `next.config.mjs` → `images.remotePatterns`
- Confirme que o domínio está na lista
- Verifique CORS no backend

### API não conecta
- Confirme `NEXT_PUBLIC_API_URL` está correta
- Verifique se o backend está rodando na porta 3001
- Cheque firewall e Nginx proxy

### Build falha
- Verifique Node.js version (recomendado: v18+)
- Limpe cache: `rm -rf .next node_modules && npm install`
- Verifique logs: `npm run build 2>&1 | tee build.log`

---

## 📝 Logs

```bash
# Backend
pm2 logs electrosal-backend

# Frontend
pm2 logs electrosal-frontend

# Todos
pm2 logs
```

---

## 🔄 Atualização (Deploy de Nova Versão)

```bash
# 1. Pull do repositório
git pull origin main

# 2. Backend
cd apps/backend
npm install
npx prisma generate
npm run build
pm2 restart electrosal-backend

# 3. Frontend
cd apps/frontend
npm install
npm run build
pm2 restart electrosal-frontend
```

---

## ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados acessível
- [ ] Backend rodando e respondendo
- [ ] Frontend rodando e acessível
- [ ] Nginx configurado e funcionando
- [ ] SSL/HTTPS ativo
- [ ] PM2 configurado para auto-restart
- [ ] Domínios apontando corretamente
- [ ] Imagens carregando corretamente
- [ ] Login funcionando
- [ ] Landing Page editável

---

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs do PM2
2. Logs do Nginx: `/var/log/nginx/error.log`
3. Variáveis de ambiente
4. Conexão com banco de dados
