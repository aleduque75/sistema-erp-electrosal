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


# ... você escreve seu código, cria arquivos, etc ...

# Quando chegar a um ponto lógico, salve seu progresso:

# 1. Adicione os arquivos que você modificou para a "área de preparação"
git add .

# 2. Crie o "ponto de salvamento" com uma mensagem clara e descritiva
git commit -m "feat: adiciona o formulário inicial de cadastro de cliente"


# 1. Volte para a branch principal
git checkout main

# 2. Atualize a branch main com qualquer mudança que possa ter vindo do servidor
git pull origin main

# 3. Traga todas as alterações do seu branch para a main
git merge feature/nome-da-sua-feature

# 4. Envie o resultado da união para o servidor (GitHub)
git push origin main

# 5. (Opcional, mas recomendado) Apague o branch que não será mais usado
git branch -d feature/nome-da-sua-feature


# Restaura todos os arquivos para a versão do último commit
git restore .



# 1. Volte para a segurança da branch main
git checkout main

# 2. Delete o branch problemático para sempre (use -D para forçar)
git branch -D feature/nome-da-sua-feature