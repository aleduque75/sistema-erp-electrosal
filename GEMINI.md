# Visão Geral do Projeto e Regras de Operação

Bem-vindo ao sistema ERP Electrosal. Este documento serve como diretriz fundamental e ponto de partida para o agente e desenvolvedor.

---

## 🌐 Infraestrutura Atual (Produção)
- **Hospedagem:** VPS Oracle Cloud (Arquitetura ARM Ampere A1).
- **Gerenciador de Ambientes:** **Dokploy**.
- **Deploy:** Imagens Docker compiladas via GitHub Actions (`runs-on: ubuntu-24.04-arm` para `linux/arm64`) e enviadas ao GHCR (`ghcr.io`), disparando webhook do Dokploy automaticamente.
- **Roteamento:** Nginx reverso na porta `8090` apontando para `https://erp.electrosal.com.br`.

---

## 🧠 Estado Atual do Projeto & Continuidade de Contexto
Para manter o contexto entre sessões e evitar perda de histórico após reinicializações, consulte sempre:
- [**Estado do Projeto & Infraestrutura**](.agent/workflows/erp-project-state.md)
- [**Guia Mestre de Manutenção**](.agent/workflows/erp-master-maintenance.md)

---

## 📚 Base de Conhecimento do Projeto
- [**Temas Criados**](docs/01_temas_criados.md): Decisões de arquitetura e convenções.
- [**Funcionalidades Finalizadas**](docs/02_funcionalidades_finalizadas.md): Recursos em produção.
- [**Funcionalidades em Andamento**](docs/03_funcionalidades_em_andamento.md): Trabalho ativo.
- [**Funcionalidades a Fazer**](docs/04_funcionalidades_a_fazer.md): Backlog e roadmap.
- [**Guia de Integração Evolution API**](docs/integracoes/evolution_api_guide.md)
