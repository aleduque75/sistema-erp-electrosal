# 🎯 Fix de Imagens - Resumo Executivo

## ❌ Problema

Imagens da landing page (logo e banners) retornavam erro **"received text/html"** ao invés da imagem.

## 🔍 Causa Raiz

**Next.js Standalone Mode** não copia automaticamente as pastas:
- ❌ `public/` (onde estão logo.png, banners)
- ❌ `.next/static/` (assets otimizados)

Resultado: Servidor standalone não encontrava as imagens → retornava página 404 em HTML.

## ✅ Solução Implementada

### Arquivo modificado: `deploy.sh`

Adicionado após `pnpm build`:

```bash
# ⚠️ IMPORTANTE: Next.js standalone NÃO copia public e static automaticamente!
echo "📁 Copiando pasta public para standalone..."
cp -r public .next/standalone/apps/frontend/public

echo "📁 Copiando pasta static para standalone..."
cp -r .next/static .next/standalone/apps/frontend/.next/static
```

## 🚀 Próximos Passos

### 1. Commit e Push

```bash
git add deploy.sh STANDALONE-PUBLIC-FIX.md FIX-IMAGENS-RESUMO.md
git commit -m "fix: copy public and static folders to standalone build

- Next.js standalone mode doesn't copy public/ automatically
- Images (logo, banners) were returning 'text/html' error
- Added manual copy of public/ and .next/static/ after build
- Fixes landing page images not loading on VPS"
git push origin main
```

### 2. Deploy na VPS

```bash
# SSH na VPS
ssh root@76.13.229.204

# Executar deploy
cd /var/www/electrosal
./deploy.sh
```

### 3. Verificar

```bash
# Conferir se pastas foram copiadas
ls -la /var/www/electrosal/apps/frontend/.next/standalone/apps/frontend/public/images/landing/

# Deve mostrar:
# - logo.png
# - banner-galvano.png
# - banner-lab.png
# - banner-bijou.png
# - banner-banho.png

# Testar endpoint
curl -I http://localhost:3000/images/landing/logo.png

# Deve retornar: HTTP/1.1 200 OK + Content-Type: image/png
```

### 4. Acessar o site

Abra no navegador:
- https://electrosal.com.br

**Deve aparecer**:
- ✅ Logo da Electrosal
- ✅ Banner de fundo no Hero
- ✅ Sem erros "text/html" no console

## 📋 Checklist

- [ ] Commit realizado
- [ ] Push para main
- [ ] Deploy na VPS executado
- [ ] Pastas copiadas corretamente
- [ ] Imagens carregando no site
- [ ] Sem erros no console do navegador

## 📚 Documentação Completa

Ver `STANDALONE-PUBLIC-FIX.md` para detalhes técnicos e troubleshooting.

## ⏱️ Tempo Estimado

- Commit e push: 1 min
- Deploy na VPS: 3-5 min
- Verificação: 1 min

**Total**: ~5-7 minutos

---

**Status Atual**: ✅ Fix implementado e documentado. Aguardando deploy.
