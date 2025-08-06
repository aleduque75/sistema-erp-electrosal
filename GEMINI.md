# GEMINI.md - Configuração para o Projeto Sistema de Beleza

## Persona

Você é Gemini, um assistente de programação especialista em full-stack com TypeScript. Seu foco é em NestJS para o backend e Next.js com Tailwind CSS e shadcn/ui para o frontend. Forneça respostas claras, didáticas e em Português do Brasil, sempre priorizando as melhores práticas.

## Contexto do Projeto

Este é um monorepo gerenciado com `pnpm` contendo um sistema de gestão para salões de beleza.

- **Backend:** `apps/backend` (NestJS, Prisma, PostgreSQL)
- **Frontend:** `apps/frontend` (Next.js App Router, shadcn/ui, Tailwind CSS)
- **Core/Domain:** `packages/core` (Contém entidades de domínio puras)

## Padrões e Arquitetura

### Backend (NestJS)

- **Multi-Tenancy:** A arquitetura foi refatorada para ser multi-organização. Quase todas as entidades de negócio (Clients, Products, Sales, etc.) são vinculadas a uma `Organization` através de um campo `organizationId`. Todas as consultas e criações nos `Services` são filtradas por este ID.
- **Autenticação:** Usa Passport.js.
  - `LocalStrategy`: Valida email e senha. A busca por email é case-insensitive (`.toLowerCase()`) e remove espaços (`.trim()`).
  - `JwtStrategy`: Valida o token JWT em cada requisição.
  - O payload do JWT contém `sub` (userId) e `orgId` (organizationId).
  - Um `JwtAuthGuard` global protege todas as rotas. Rotas públicas (login/register) são liberadas com um decorator `@Public`.
  - Um decorator `@CurrentUser` é usado para extrair dados do usuário/organização do token nos controllers.
- **Banco de Dados:**
  - Gerenciado pelo Prisma ORM. O modelo `Media` inclui campos `width` e `height` para dimensões de imagens.
  - O script `prisma/seed.ts` é projetado para limpar o banco de dados completamente e depois popular com uma Organização, um Usuário e um Plano de Contas padrão.
  - A estratégia de backup/restore recomendada é com as ferramentas nativas do PostgreSQL (`pg_dump` e `pg_restore`).
- **Upload e Mídia:** O `media.service.ts` usa a biblioteca `sharp` para extrair e salvar as dimensões da imagem no momento do upload.
- **Servir Arquivos Estáticos:** O `app.module.ts` está configurado com `@nestjs/serve-static` para servir a pasta `uploads` publicamente na rota `/uploads`, permitindo o acesso direto às imagens salvas.
- **CORS:** A configuração em `main.ts` é dinâmica para aceitar `localhost` e qualquer IP da rede local (`192.168.x.x`), facilitando o desenvolvimento mobile.
- **Configurações da Organização:** O campo `creditCardReceiveDays` (dias para recebimento de cartão de crédito) foi movido para o modelo `Organization`, refletindo que é uma configuração global da empresa.

### Frontend (Next.js)

- **Arquitetura de Componentes:** Usamos uma mistura de Server Components e Client Components do Next.js App Router.
  - **Server Components (async):** Usados para páginas e componentes de layout que precisam buscar dados antes da renderização (ex: `PublicNavbar`, `HomePage`).
  - **Client Components (`"use client";`):** Usados para componentes que precisam de interatividade e hooks (ex: formulários, modais, `NavbarActions`).
- **Estilo e Tema:**
  - `Tailwind CSS` com componentes `shadcn/ui`.
  - O sistema de temas foi unificado no arquivo `apps/frontend/src/config/themes.ts`, que serve como única fonte para todas as paletas de cores.
  - Um `ThemeContext` global aplica as variáveis de cor do tema diretamente no elemento `<html>`, garantindo que toda a aplicação reaja às mudanças.
  - Existem dois controles de tema: um seletor de paleta principal (no `LandingPageManager`) e um botão de toggle (Sol/Lua) para alternar entre os modos claro/escuro do tema selecionado.
- **Formulários:** Usamos uma mistura de `react-hook-form` com `zod` para formulários complexos e `useState` para os mais simples.
- **Comunicação com API:** Um wrapper do Axios (`lib/api.ts`) é usado para todas as chamadas, com interceptors para adicionar o token JWT e para lidar com a expiração de sessão (erro 401), redirecionando para o login.
- **Responsividade do Menu:**
  - O menu hambúrguer (`MobileMenu`) agora é exibido em tablets (telas `md` e `lg`) e o menu desktop (`MainMenu`) apenas em telas maiores (`xl`).
  - O `MobileMenu` utiliza o componente `Sheet` (abre da lateral) para uma melhor experiência em tablets.
  - Ajustes nas classes de flexbox garantem que o menu hambúrguer fique alinhado à direita em telas menores.

## Funcionalidades Específicas Implementadas

- **Landing Page Dinâmica:**
  - O conteúdo (logo, texto, seções Hero e Features) é gerenciado por um painel (`LandingPageManager`).
  - A `PublicNavbar` e o `Header` do dashboard renderizam o logo e o texto de forma condicional com base na proporção da imagem (quadrada vs. retangular) para otimizar o layout.
- **Importação de Extrato (OFX) e Clientes (CSV):**
  - Fluxos de duas etapas com telas de conciliação.
  - Permitem edição de dados antes da importação final.
  - Prevenção de duplicatas (usando `fitId` para transações e `email` para clientes).
- **Endereço do Cliente:**
  - O endereço é estruturado (CEP, logradouro, etc.) e o formulário busca o endereço automaticamente via `ViaCEP`.
- **Backup via UI:**
  - Existe uma funcionalidade de backup no painel de Configurações.
  - O backend executa o comando `pg_dump` para gerar um backup do banco e salvá-lo em uma pasta no servidor.
- **Gestão de Vendas:**
  - **Vendas a Prazo:** Implementada a gestão de prazos de pagamento personalizados, com aplicação de juros simples e geração de múltiplas contas a receber (uma por parcela).
  - **Vendas com Cartão de Crédito:** Lógica de cálculo de valor final e valor a receber aprimorada, considerando o toggle de absorção de taxa e gerando uma única conta a receber com data de vencimento configurável.
  - **Vendas à Vista:** Restaurada a funcionalidade de geração de conta a receber e movimentação em conta corrente.

## Arquivos a Ignorar

- `node_modules`
- `.next`
- `dist`
- `coverage`
- `pnpm-lock.yaml`
- `*.log`
- `backup.dump`

---

## Histórico de Alterações (Referência)

<details>
<summary><strong>Ver Histórico de Commits e Migrações</strong></summary>

### Histórico de Commits

- **3b5d67c** - feat: Implementa gestão de vendas (à vista, a prazo, cartão) e melhora responsividade do menu
- **a1b2c3d** - fix: Corrige URLs de imagens que estavam quebradas
- **3268bde** - deposi vai ser multitenet
- **978e8d3** - imports funcioanando sistema funcionando
- **3bf6bcd** - Fix: Atualiza versao dotenv-expand no backend
- **76f221f** - feat: up
- **...** (e outros commits)

### Histórico de Migrações do Banco de Dados

- **20250708195618_init**
- **...** (e outras migrações)
- **20250803123954_add_width_height_to_media**
- **20250806112628_add_payment_terms** (Adição da tabela PaymentTerm)
- **(db push)** - move-cc-days-to-org (Movimentação de creditCardReceiveDays para Organization)

</details>

## Roadmap de Futuras Funcionalidades

- [ ] **Módulo de Agendamento:** Criar a funcionalidade de agendamento de serviços.
- [ ] **Permissões de Usuário (Roles):** Diferenciar o que um `ADMIN` pode fazer versus um `USER`.
- [ ] **Relatórios Avançados:** Criar uma seção de relatórios com gráficos detalhados.
- [ ] **Integração com Google Drive:** Finalizar a funcionalidade de backup para salvar os arquivos na nuvem.
- [ ] **Validação e Máscara de CPF/CNPJ:** Adicionar validação e máscaras de formatação no frontend.