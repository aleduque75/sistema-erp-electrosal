# Funcionalidades em Andamento

Esta seção descreve as funcionalidades que estão atualmente em desenvolvimento ou aguardando revisão.

---

## 1. Integração com WhatsApp API (Evolution API)

**Descrição:** Implementação de serviços e endpoints para enviar e receber mensagens do WhatsApp através da Evolution API. Inclui tratamento de webhooks, roteamento de mensagens e comandos básicos como `/transferir`.

**Componentes Afetados:**
*   `apps/backend/src/whatsapp`
*   `apps/backend/src/whatsapp-routines`
*   `apps/frontend/src/app/(protected)/(dashboard)/whatsapp-routines`
*   Configuração Docker para `evolution-api`.

**Status Atual:**
*   Envio de mensagens configurado e funcionando.
*   Webhook recebendo eventos (após depuração inicial).
*   Comando `/transferir` em desenvolvimento (tratamento de contas e transações).
*   Rotinas dinâmicas em desenvolvimento.

**Próximos Passos:**
*   Concluir a lógica do comando `/transferir` com validações.
*   Implementar a interface para criação e gestão de rotinas dinâmicas (frontend e backend).
*   Testes de integração.

---

## 2. Módulo Financeiro - Contas a Pagar/Receber

**Descrição:** Refatoração e expansão do módulo financeiro para melhor gestão de contas a pagar e receber, incluindo integração com transações bancárias e fluxo de caixa.

**Componentes Afetados:**
*   `apps/backend/src/accounts-pay`
*   `apps/backend/src/accounts-rec`
*   `apps/backend/src/transactions`
*   `apps/frontend/src/app/(protected)/(dashboard)/finance`

**Status Atual:**
*   Funcionalidades básicas de CRUD de contas a pagar/receber.
*   Integração inicial com importação OFX.

**Próximos Passos:**
*   Melhorar relatórios e dashboards financeiros.
*   Implementar reconciliação bancária.

---

## Outras Funcionalidades em Andamento:

*   ... (Adicione outras funcionalidades aqui)
