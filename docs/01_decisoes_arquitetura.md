# Temas Criados

Esta seção é dedicada a documentar decisões de arquitetura, padrões de design, convenções e outros temas importantes que guiam o desenvolvimento do projeto.


---


## Exemplo de Tema: Estrutura de Monorepo com PNPM

**Data da Decisão:** 2024-01-01

**Descrição:** O projeto utiliza uma estrutura de monorepo gerenciada pelo PNPM para otimizar o compartilhamento de código entre `backend` (NestJS) e `frontend` (Next.js), além de pacotes de utilitários (`packages/core`).

**Justificativa:**
*   Compartilhamento fácil de tipos e lógica de negócios.
*   Instalação de dependências mais eficiente (hoisting do PNPM).
*   Facilita a colaboração e a manutenção de múltiplos projetos relacionados.

**Impacto:**
*   Desenvolvedores devem usar `pnpm` para gerenciamento de dependências.
*   Configurações de `tsconfig.json` e `package.json` em cada pacote devem seguir as diretrizes do monorepo.

---

*A documentação sobre o sistema de temas e estilos foi movida para o arquivo [STYLESYSTEM.md](STYLESYSTEM.md).*
