# Descrição Geral do Sistema ERP Electrosal

Este documento descreve as principais funcionalidades, módulos e fluxos do sistema ERP Electrosal.

## Visão Geral
O sistema ERP Electrosal é uma plataforma web desenvolvida em monorepo, utilizando as tecnologias Next.js (frontend), NestJS (backend), Prisma ORM (banco de dados PostgreSQL) e React Context API para autenticação e controle de estado. O objetivo é gerenciar processos administrativos, financeiros, industriais e de apoio de uma empresa do setor metalúrgico.

## Principais Módulos e Funcionalidades

### 1. Autenticação e Usuários
- Cadastro, login e logout de usuários
- Controle de sessão e permissões
- Contexto global de autenticação

### 2. Dashboard
- Visão geral de indicadores financeiros e operacionais
- Gráficos de vendas, fluxo de caixa, contas a pagar/receber, saldos de metais, etc.

### 3. Vendas
- Cadastro e edição de vendas
- Parcelamento, recebimento e acompanhamento de parcelas
- Relatórios de vendas e exportação de dados

### 4. Compras
- Cadastro de pedidos de compra
- Recebimento de mercadorias e controle de estoque
- Gestão de fornecedores

### 5. Contas a Pagar e a Receber
- Lançamento, edição e baixa de contas
- Controle de status (pendente, pago, cancelado)
- Relatórios financeiros

### 6. Cartões de Crédito
- Cadastro de cartões
- Lançamento e conciliação de transações
- Geração e pagamento de faturas

### 7. Produção e Estoque
- Controle de lotes de metais puros
- Registro de reações químicas e análises laboratoriais
- Movimentação de estoque e ajustes

### 8. Relatórios
- Balancete, fluxo de caixa, contas a pagar/receber, vendas, compras, estoque
- Exportação em PDF e CSV

### 9. Tutoriais e Ajuda
- Área de tutoriais com conteúdo em Markdown
- Menu de ajuda integrado ao sistema

### 10. Auditoria e Logs
- Registro de ações dos usuários
- Consulta de logs de auditoria

### 11. Backup e Restauração
- Geração e restauração de backups do banco de dados

### 12. Integrações
- Importação de dados via arquivos JSON e XML
- Integração com WhatsApp para notificações

## Fluxo Básico de Uso
1. Usuário faz login
2. Acessa o dashboard com visão geral
3. Navega pelos módulos via menu lateral
4. Realiza operações de vendas, compras, lançamentos financeiros, produção, etc.
5. Consulta relatórios e auditoria
6. Utiliza área de tutoriais para suporte

## Tecnologias Utilizadas
- **Frontend:** Next.js, React, TailwindCSS, shadcn/ui
- **Backend:** NestJS, Prisma ORM
- **Banco de Dados:** PostgreSQL
- **Gerenciamento de pacotes:** pnpm (monorepo)
- **Outros:** React Hook Form, Zod, Radix UI, Sonner (notificações)

## Estrutura do Projeto
- `apps/frontend`: Aplicação web (Next.js)
- `apps/backend`: API REST (NestJS)
- `packages/`: Pacotes compartilhados (core, ui, config)
- `prisma/`: Migrations e seed do banco
- `json-imports/`, `xml/`: Dados de importação

## Observações
- O sistema é modular e expansível.
- Possui controle de permissões e logs de auditoria.
- Suporta múltiplos ambientes (.env).

---
Este documento pode ser expandido conforme novas funcionalidades forem implementadas.
