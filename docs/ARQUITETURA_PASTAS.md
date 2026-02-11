# Arquitetura de Pastas do Sistema ERP Electrosal

Abaixo está um resumo da estrutura de diretórios do sistema, destacando os principais módulos e suas responsabilidades.

```
/
├── apps/
│   ├── backend/                # API NestJS (código-fonte, prisma, testes)
│   │   ├── src/                 # Código principal do backend (módulos, controllers, services)
│   │   ├── prisma/              # Schema, migrations e seed do banco
│   │   └── ...
│   └── frontend/               # Aplicação Next.js (código-fonte, configs, public)
│       ├── src/                 # Código principal do frontend
│       │   ├── app/             # Rotas e páginas (Next.js App Router)
│       │   ├── components/      # Componentes reutilizáveis (UI, layout, tabelas, etc)
│       │   ├── contexts/        # Contextos React (auth, tema, etc)
│       │   ├── config/          # Configurações de menu, landing page, etc
│       │   └── ...
│       └── public/              # Arquivos estáticos (imagens, favicon, etc)
├── packages/
│   ├── core/                   # Código compartilhado (tipos, utilitários, hooks)
│   ├── ui/                     # Componentes de UI compartilhados
│   └── config/                 # Configurações compartilhadas (tsconfig, etc)
├── json-imports/               # Dados de importação em JSON
├── xml/                        # Dados de importação em XML
├── db_data/                    # Dados persistentes do banco (docker)
├── backup.dump                 # Backup do banco de dados
├── docker-compose.yml          # Orquestração de containers
├── pnpm-workspace.yaml         # Configuração do monorepo
├── turbo.json                  # Configuração do TurboRepo
└── ...                         # Outros arquivos de configuração e documentação
```

## Resumo dos principais diretórios
- **apps/backend**: Backend (NestJS, Prisma, API)
- **apps/frontend**: Frontend (Next.js, React, UI)
- **packages**: Pacotes compartilhados (core, ui, config)
- **json-imports, xml**: Importação de dados
- **db_data, backup.dump**: Dados e backup do banco

Essa arquitetura facilita a separação de responsabilidades, o reuso de código e a escalabilidade do sistema.
