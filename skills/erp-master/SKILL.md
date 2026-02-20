# SKILL: Gerenciamento de Ecossistema ERP Electrosal

Esta skill capacita o agente a realizar a manutenção completa do sistema ERP, incluindo Landing Page, Mídia, n8n e CI/CD.

## Capacidades

- **Depuração de Webhooks**: Entendimento da estrutura de payload híbrida para n8n e Evolution API.
- **Gerenciamento de Mídia**: Configuração de caminhos dinâmicos e endpoints públicos/privados.
- **Manutenção de Infraestrutura**: Ajustes em domínios via Nginx Proxy Manager e redes Docker.
- **Deploy Seguro**: Operação do script `deploy.sh` e GitHub Actions com PM2.

## Arquivos de Referência

- **Workflow Detalhado**: `.agent/workflows/erp-master-maintenance.md`
- **Script de Deploy**: `deploy.sh`
- **Configuração PM2**: `ecosystem.config.js`
- **Configuração de Mídia**: `apps/backend/src/media/media.module.ts`

## Procedimentos Padrão

Sempre consulte o Workflow `erp-master-maintenance.md` antes de realizar alterações estruturais em domínios ou fluxos de build.
