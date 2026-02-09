╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    1 # 🚀 Guia de Deploy - VPS Hostinger
    2
    3 ## 📋 Checklist Pré-Deploy
    4
    5 ### 1. Variáveis de Ambiente
    6
    7 #### Frontend (.env.local ou variáveis do servidor)
    8 ```bash
    9 NEXT_PUBLIC_API_URL=https://api.electrosal.com.br
   10 ```
   11
   12 #### Backend (.env)
   13 ```bash
   14 # Banco de Dados
   15 DATABASE_URL="postgresql://usuario:senha@host:porta/banco?schema=public"
   16
   17 # JWT
   18 JWT_SECRET="sua_chave_secreta_forte"
   19
   20 # Organization
   21 DEFAULT_ORGANIZATION_ID="uuid-da-organizacao"
   22
   23 # APIs Externas
   24 EVOLUTION_API_KEY="sua_key"
   25 EVOLUTION_INSTANCE_TOKEN="seu_token"
   26 ```
   27
   28 ---
   29
   30 ## 🔧 Configurações Importantes
   31
   32 ### Next.js - Domínios de Imagem Permitidos
   33
   34 O arquivo `apps/frontend/next.config.mjs` já está configurado para:
   35
   36 ✅ **Desenvolvimento:**
   37 - `http://localhost:3001`
   38
   39 ✅ **Produção:**
   40 - `https://api.electrosal.com.br`
   41 - `https://electrosal.com.br`
   42 - `https://76.13.229.204` (IP direto, se necessário)
   43
   44 ---
   45
   46 ## 📦 Build e Deploy
   47
   48 ### Backend (NestJS)
   49
   50 ```bash
   51 cd apps/backend
   52
   53 # 1. Instalar dependências
   54 npm install
   55
   56 # 2. Gerar Prisma Client
   57 npx prisma generate
   58
   59 # 3. Sincronizar banco (primeira vez)
   60 npx prisma db push
   61
   62 # 4. Build
   63 npm run build
   64
   65 # 5. Iniciar em produção
   66 npm run start:prod
   67 ```
   68
   69 **Porta padrão:** 3001
   70
   71 ---
   72
   73 ### Frontend (Next.js)
   74
   75 ```bash
   76 cd apps/frontend
   77
   78 # 1. Instalar dependências
   79 npm install
   80
   81 # 2. Build
   82 npm run build
   83
   84 # 3. Iniciar em produção
   85 npm start
   86 ```
   87
   88 **Porta padrão:** 3000
   89
   90 ---
   91
   92 ## 🌐 Nginx Configuration (Exemplo)
   93
   94 ```nginx
   95 # Backend API
   96 server {
   97     listen 80;
   98     server_name api.electrosal.com.br;
   99
  100     location / {
  101         proxy_pass http://localhost:3001;
  102         proxy_http_version 1.1;
  103         proxy_set_header Upgrade $http_upgrade;
  104         proxy_set_header Connection 'upgrade';
  105         proxy_set_header Host $host;
  106         proxy_cache_bypass $http_upgrade;
  107         proxy_set_header X-Real-IP $remote_addr;
  108         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  109         proxy_set_header X-Forwarded-Proto $scheme;
  110     }
  111 }
  112
  113 # Frontend
  114 server {
  115     listen 80;
  116     server_name electrosal.com.br www.electrosal.com.br;
  117
  118     location / {
  119         proxy_pass http://localhost:3000;
  120         proxy_http_version 1.1;
  121         proxy_set_header Upgrade $http_upgrade;
  122         proxy_set_header Connection 'upgrade';
  123         proxy_set_header Host $host;
  124         proxy_cache_bypass $http_upgrade;
  125     }
  126 }
  127 ```
  128
  129 ---
  130
  131 ## 🔒 SSL/HTTPS com Certbot
  132
  133 ```bash
  134 # Instalar Certbot
  135 sudo apt install certbot python3-certbot-nginx
  136
  137 # Gerar certificados
  138 sudo certbot --nginx -d api.electrosal.com.br
  139 sudo certbot --nginx -d electrosal.com.br -d www.electrosal.com.br
  140
  141 # Renovação automática
  142 sudo certbot renew --dry-run
  143 ```
  144
  145 ---
  146
  147 ## 🔄 PM2 para Process Management
  148
  149 ```bash
  150 # Instalar PM2
  151 npm install -g pm2
  152
  153 # Backend
  154 cd apps/backend
  155 pm2 start dist/main.js --name "electrosal-backend"
  156
  157 # Frontend
  158 cd apps/frontend
  159 pm2 start npm --name "electrosal-frontend" -- start
  160
  161 # Salvar configuração
  162 pm2 save
  163
  164 # Auto-start no boot
  165 pm2 startup
  166 ```
  167
  168 ---
  169
  170 ## 📊 Verificação de Deploy
  171
  172 ### 1. Backend Health Check
  173 ```bash
  174 curl https://api.electrosal.com.br/api/health
  175 ```
  176
  177 ### 2. Frontend
  178 ```bash
  179 curl https://electrosal.com.br
  180 ```
  181
  182 ### 3. Imagens
  183 ```bash
  184 curl -I https://api.electrosal.com.br/api/public-media/[UUID]
  185 ```
  186
  187 ---
  188
  189 ## 🐛 Troubleshooting
  190
  191 ### Imagens não aparecem
  192 - Verifique `next.config.mjs` → `images.remotePatterns`
  193 - Confirme que o domínio está na lista
  194 - Verifique CORS no backend
  195
  196 ### API não conecta
  197 - Confirme `NEXT_PUBLIC_API_URL` está correta
  198 - Verifique se o backend está rodando na porta 3001
  199 - Cheque firewall e Nginx proxy
  200
  201 ### Build falha
  202 - Verifique Node.js version (recomendado: v18+)
  203 - Limpe cache: `rm -rf .next node_modules && npm install`
  204 - Verifique logs: `npm run build 2>&1 | tee build.log`
  205
  206 ---
  207
  208 ## 📝 Logs
  209
  210 ```bash
  211 # Backend
  212 pm2 logs electrosal-backend
  213
  214 # Frontend
  215 pm2 logs electrosal-frontend
  216
  217 # Todos
  218 pm2 logs
  219 ```
  220
  221 ---
  222
  223 ## 🔄 Atualização (Deploy de Nova Versão)
  224
  225 ```bash
  226 # 1. Pull do repositório
  227 git pull origin main
  228
  229 # 2. Backend
  230 cd apps/backend
  231 npm install
  232 npx prisma generate
  233 npm run build
  234 pm2 restart electrosal-backend
  235
  236 # 3. Frontend
  237 cd apps/frontend
  238 npm install
  239 npm run build
  240 pm2 restart electrosal-frontend
  241 ```
  242
  243 ---
  244
  245 ## ✅ Checklist Final
  246
  247 - [ ] Variáveis de ambiente configuradas
  248 - [ ] Banco de dados acessível
  249 - [ ] Backend rodando e respondendo
  250 - [ ] Frontend rodando e acessível
  251 - [ ] Nginx configurado e funcionando
  252 - [ ] SSL/HTTPS ativo
  253 - [ ] PM2 configurado para auto-restart
  254 - [ ] Domínios apontando corretamente
  255 - [ ] Imagens carregando corretamente
  256 - [ ] Login funcionando
  257 - [ ] Landing Page editável
  258
  259 ---
  260
  261 ## 📞 Suporte
  262
  263 Se encontrar problemas, verifique:
  264 1. Logs do PM2
  265 2. Logs do Nginx: `/var/log/nginx/error.log`
  266 3. Variáveis de ambiente
  267 4. Conexão com banco de dados
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌