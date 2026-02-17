🏗️ Arquitetura e Padrões do Sistema Electrosal

Este documento detalha as decisões técnicas e a estrutura de dados central para orientar o desenvolvimento.
1. Stack Tecnológica

    Frontend: Next.js (App Router) com Tailwind CSS e Shadcn/UI.

    Backend: NestJS (Node.js framework).

    ORM: Prisma para PostgreSQL.

    Automação/Mensageria: Evolution API (WhatsApp) e n8n.

    Hospedagem: VPS Hostinger (Docker).

2. Padrões de Código

    Backend: Uso de DTOs para validação, Services para lógica de negócio e Controllers para rotas.

    Multi-tenancy: Quase todas as tabelas (Vendas, Pessoas, Produtos) são vinculadas a uma Organization. Sempre filtrar por organizationId.

    Git: Commits seguem o padrão de mensagens claras (ex: feat:, fix:, chore:).

3. Entidades Principais do Banco (Prisma Schema)

    Organization: A raiz do sistema. Todas as contas e dados pertencem a uma organização.

    User: Usuários do sistema, vinculados a organizações via UserOrganization.

    Pessoa: Cadastro unificado de Clientes, Fornecedores e Funcionários.

    Sale (Vendas): Registro de transações comerciais.

    ChemicalAnalysis: Parte crítica do sistema, lida com a recuperação de metais (Prata/Ouro).

4. Integrações Ativas

    Evolution API: Utilizada para envio de notificações de vendas e relatórios de análises químicas via WhatsApp.

    n8n: Orquestração de fluxos de trabalho e automações de e-mail/mensagens.

5. Convenções de API

    Base URL: http://localhost:3002/api

    Endpoints de Documentação (Knowledge Base):

        GET /knowledge-base: Lista arquivos.

        GET /knowledge-base/:filename: Lê arquivo.