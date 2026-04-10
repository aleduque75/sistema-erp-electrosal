# 🔧 Fix: Imagens da pasta public em Next.js Standalone

## 🐛 Problema Identificado

**Sintoma**: Imagens retornam erro "received text/html" ao invés da imagem.

**Causa Raiz**: No modo **standalone** do Next.js, as pastas `public` e `.next/static` **NÃO são copiadas automaticamente** para o diretório de build.

```
❌ ANTES (após build):
.next/standalone/apps/frontend/
  ├── server.js
  ├── package.json
  └── ... (sem public/ e sem .next/static/)

✅ DEPOIS (com fix):
.next/standalone/apps/frontend/
  ├── server.js
  ├── package.json
  ├── public/              ← COPIADO MANUALMENTE
  │   └── images/
  │       └── landing/
  │           ├── logo.png
  │           └── banner-*.png
  └── .next/
      └── static/          ← COPIADO MANUALMENTE
```

---

## ✅ Solução Aplicada

### 1. Atualizado `deploy.sh`

Adicionadas duas linhas após `pnpm build`:

```bash
# ⚠️ IMPORTANTE: Next.js standalone NÃO copia public e static automaticamente!
echo "📁 Copiando pasta public para standalone..."
cp -r public .next/standalone/apps/frontend/public

echo "📁 Copiando pasta static para standalone..."
cp -r .next/static .next/standalone/apps/frontend/.next/static
```

---

## 🧪 Como Testar na VPS

### 1. Fazer deploy do fix

```bash
# Na sua máquina local
git add deploy.sh STANDALONE-PUBLIC-FIX.md
git commit -m "fix: copy public and static folders to standalone build"
git push origin main

# Na VPS
cd /var/www/electrosal  # ou seu diretório
./deploy.sh
```

### 2. Verificar se as pastas foram copiadas

```bash
# Na VPS, após o deploy
cd /var/www/electrosal/apps/frontend

# Verificar se a pasta public existe no standalone
ls -la .next/standalone/apps/frontend/public/images/landing/

# Deve listar:
# - logo.png
# - banner-galvano.png
# - banner-lab.png
# - banner-bijou.png
# - banner-banho.png

# Verificar se a pasta static existe
ls -la .next/standalone/apps/frontend/.next/static/
```

### 3. Testar acesso às imagens

```bash
# Na VPS
curl -I http://localhost:3000/images/landing/logo.png

# Deve retornar:
# HTTP/1.1 200 OK
# Content-Type: image/png
```

### 4. Verificar logs do PM2

```bash
pm2 logs erp-frontend --lines 50

# NÃO deve aparecer erros de "404" ou "text/html" para imagens
```

---

## 📋 Checklist de Verificação

Após deploy, confirme:

- [ ] Pasta `public` existe em `.next/standalone/apps/frontend/public/`
- [ ] Pasta `static` existe em `.next/standalone/apps/frontend/.next/static/`
- [ ] Imagens da landing page carregam corretamente
- [ ] Logo aparece no Hero
- [ ] Banner de fundo aparece no Hero
- [ ] Não há erros "received text/html" no console do navegador
- [ ] PM2 não reporta erros 404 para imagens

---

## 🔍 Entendendo o Problema

### Como Next.js Standalone funciona:

1. **Build normal**: `next build` gera `.next/`
2. **Modo standalone**: Cria `.next/standalone/` com um servidor minimal
3. **Problema**: A pasta `public` não é copiada automaticamente
4. **Consequência**: Servidor standalone não encontra imagens estáticas

### Por que as imagens retornam "text/html"?

Quando o Next.js não encontra uma imagem em `/images/landing/logo.png`:
1. Tenta servir o arquivo
2. Não encontra (404)
3. Retorna a página de erro do Next.js (HTML)
4. Navegador tenta renderizar HTML como imagem → ERRO

---

## 📚 Referências

- [Next.js Standalone Docs](https://nextjs.org/docs/pages/api-reference/next-config-js/output#automatically-copying-traced-files)
- [Issue no GitHub sobre public folder](https://github.com/vercel/next.js/discussions/16995)

---

## 🆘 Se ainda não funcionar

### 1. Verificar permissões

```bash
# Na VPS
chmod -R 755 .next/standalone/apps/frontend/public
```

### 2. Verificar se PM2 está usando o standalone correto

```bash
# Verificar ecosystem.config.js
cat ../../ecosystem.config.js

# Script deve apontar para:
# script: ".next/standalone/apps/frontend/server.js"
```

### 3. Reiniciar PM2 completamente

```bash
pm2 delete all
pm2 start ecosystem.config.js --env production
pm2 save
```

### 4. Verificar Nginx (se aplicável)

```nginx
# Em /etc/nginx/sites-available/electrosal.com.br
location /_next/static/ {
    alias /var/www/electrosal/apps/frontend/.next/standalone/apps/frontend/.next/static/;
}

location /images/ {
    alias /var/www/electrosal/apps/frontend/.next/standalone/apps/frontend/public/images/;
}
```

**ATENÇÃO**: O script já deve funcionar sem configuração do Nginx, pois o Next.js standalone serve tudo automaticamente quando as pastas estão copiadas.

---

## ✅ Status

- [x] Fix implementado no `deploy.sh`
- [ ] Testado na VPS
- [ ] Imagens carregando corretamente
