# Guia Rápido de Branches no Git

Trabalhar com branches é essencial para manter seu código organizado e seguro. Pense no branch `main` como a versão estável e em produção do seu projeto, a "avenida principal".

---

### Passo 1: Criar um Novo Branch

Para iniciar uma nova funcionalidade ou correção sem afetar a `main`, você cria uma "rua lateral", que é o seu branch.

```bash
# 1. Garanta que você está na branch principal
git checkout main

# 2. (Opcional, mas recomendado) Garanta que sua principal está atualizada
git pull origin main

# 3. Crie e mude para o novo branch em um só comando
git checkout -b feature/nome-da-sua-feature