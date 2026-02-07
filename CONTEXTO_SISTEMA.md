📄 CONTEXTO_SISTEMA.md (Modelo para IAs)
🚀 Visão Geral

    Nome: Sistema ERP Electrosal

    Arquitetura: Híbrida (Docker + PM2) rodando em VPS Linux.

    Fluxo de Deploy: Automatizado via GitHub Actions. Não sugerir alterações manuais em arquivos de build ou ambiente produtivo sem considerar o workflow de CI/CD.

🛠️ Stack Tecnológica

    Backend: NestJS (TypeScript) rodando via PM2.

    Frontend: Next.js (Tailwind CSS) rodando via PM2.

    ORM: Prisma (PostgreSQL).

    Docker: Gerenciado via Portainer.

    Automação: n8n (Container Docker).

    IA Local: Ollama (Container Docker - Llama3/Mistral).

    Mensageria: Evolution API (WhatsApp) e Webhooks de Telegram.

🐳 Infraestrutura Docker

    Rede: electrosal_network (Rede bridge interna para comunicação entre n8n, Ollama e Banco).

    Stacks no Portainer:

        ai_stack: n8n + Ollama.

        db_stack: PostgreSQL.

    Volumes: Armazenados em /home/docker_volumes (partição principal).

🤖 Inteligência e Conciliação (Foco Principal)

    Objetivo: Conciliação bancária de 2 anos (Itaú PJ).

    Lógica: O sistema importa OFX -> O NestJS limpa e envia para o n8n -> O n8n usa o Ollama local para categorizar com base no Plano de Contas do banco -> O sistema atualiz>

    Transcrição: Áudios do WhatsApp/Telegram são convertidos em texto e comandos de ação pela IA.

📂 Mapeamento de Caminhos

    Caminho Root: /home/seu-usuario/app/

    Backend: ./backend/src

    Frontend: ./frontend/src

    Configurações: docker-compose.yml e schema.prisma.
