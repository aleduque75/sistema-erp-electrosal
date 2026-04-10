# Tutorial: Integração com WhatsApp para Consulta de Contas a Pagar

Este documento detalha o processo de implementação e depuração de um comando de WhatsApp (`/contas a pagar`) para consultar as contas a pagar do dia no sistema ERP.

## 1. Objetivo

O objetivo era criar um bot de WhatsApp que, ao receber o comando `/contas a pagar`, consultasse o banco de dados e retornasse uma lista das contas com vencimento no dia atual.

## 2. Componentes Principais

-   **Evolution API**: Atua como o gateway para a comunicação com a API do WhatsApp, enviando e recebendo mensagens.
-   **NestJS Backend**: A aplicação principal que contém a lógica de negócios.
-   **Webhook**: O mecanismo de comunicação entre a Evolution API e o nosso backend. A Evolution API envia um `POST` para um endpoint específico do nosso backend sempre que uma nova mensagem é recebida.

## 3. Fluxo da Funcionalidade

1.  O usuário envia a mensagem `/contas a pagar` para o número de WhatsApp do bot.
2.  A **Evolution API** recebe essa mensagem e a encaminha via `POST` para o endpoint `/api/whatsapp/webhook` do nosso backend.
3.  O `WhatsappController` no backend recebe a requisição.
4.  O `WhatsappService` é chamado para processar a mensagem.
5.  O serviço identifica o comando, consulta o `AccountsPayService` para buscar as contas no banco de dados com data de vencimento para o dia corrente.
6.  O serviço formata uma mensagem de resposta com a lista de contas ou uma notificação de que não há contas para o dia.
7.  O `WhatsappService` envia a mensagem de resposta para o usuário final através da **Evolution API**.

## 4. Implementação no Código

### 4.1. Módulo do WhatsApp (`whatsapp.module.ts`)

-   Este módulo agrupa toda a lógica relacionada ao WhatsApp.
-   Ele importa o `AccountsPayModule` para ter acesso ao `AccountsPayService` e poder consultar as contas a pagar.

### 4.2. Controlador (`whatsapp.controller.ts`)

-   **Endpoint do Webhook**: Define a rota `@Post('webhook')` que recebe as notificações da Evolution API.
-   **Processamento Inicial**: O método `handleWebhook` recebe o corpo (`@Body`) da requisição.
-   **Delegação**: A responsabilidade de processar a lógica da mensagem é delegada para o `whatsappService.handleIncomingMessage(body)`.

### 4.3. Serviço (`whatsapp.service.ts`)

-   **`handleIncomingMessage(body)`**:
    -   Extrai o texto da mensagem (`messageText`) e o número do remetente (`remoteJid`) do complexo objeto enviado pela Evolution API.
    -   Verifica se o texto corresponde ao comando `/contas a pagar`.
-   **`handleContasAPagar(remoteJid)`**:
    -   Chama `this.accountsPayService.findMany({...})` com um filtro para buscar contas não pagas (`paid: false`) com `dueDate` para o dia de hoje.
    -   Constrói a mensagem de resposta, iterando sobre os resultados.
    -   Chama `sendWhatsappMessage` para enviar a resposta.
-   **`sendWhatsappMessage(recipient, message)`**:
    -   Monta e envia uma requisição `POST` para a Evolution API (`http://localhost:8080/message/sendText/...`) para enviar a mensagem de volta ao usuário.

### 4.4. Serviço de Contas a Pagar (`accounts-pay.service.ts`)

-   Foi adicionado um novo método, `findMany`, que aceita um objeto de parâmetros do Prisma (`where`, `orderBy`, etc.). Isso o tornou flexível o suficiente para ser usado pela funcionalidade do WhatsApp, que precisava de uma consulta específica por data.

## 5. A Saga da Depuração: Um Resumo

O caminho para fazer a funcionalidade operar foi longo e revelou vários problemas em diferentes camadas da aplicação.

1.  **O Silêncio Inicial**: O primeiro problema foi que o webhook da Evolution API não parecia estar chegando ao backend. Nenhuma mensagem de log era exibida.
2.  **Investigação da Rede**:
    -   Verificamos a URL do webhook configurada na Evolution API.
    -   Usamos `docker exec` para entrar no contêiner da Evolution API e `wget` para confirmar que o contêiner conseguia alcançar o backend na rede do host (`http://192.168.1.160:3002`). Isso confirmou que o problema não era de rede Docker.
3.  **Isolando o Problema no Backend**:
    -   Um teste com `curl` diretamente na máquina host para o endpoint do webhook também não gerou logs, provando que o problema estava dentro da aplicação NestJS.
    -   Para simplificar, criamos uma rota de teste (`/api/test-route`) no `AppController`.
4.  **O Servidor Fantasma**:
    -   O `curl` para a nova rota de teste falhou com "Couldn't connect to server". Isso, junto com a observação do usuário, levantou a suspeita de que o servidor não estava iniciando corretamente devido a um **conflito de porta** (porta `3002` já em uso).
    -   Usamos `kill -9 $(lsof -t -i:3002)` para liberar a porta.
5.  **O Erro 401 Unauthorized**:
    -   Após liberar a porta, o `curl` finalmente obteve uma resposta: `401 Unauthorized`. Isso foi um grande avanço, pois provou que o servidor estava no ar, mas o **Guardião de Autenticação Global (`JwtAuthGuard`)** estava bloqueando as requisições.
6.  **Criando Acesso Público**:
    -   Para resolver o bloqueio, criamos um decorador `@Public()`.
    -   Ajustamos o `JwtAuthGuard` para ignorar a autenticação em rotas marcadas com `@Public()`.
    -   Aplicamos o decorador `@Public()` na rota de teste e na rota do webhook.
7.  **Erros de Compilação**:
    -   Com o acesso liberado, reativamos o código principal, o que revelou uma cascata de erros de tipo e lógica.
    -   **Função Duplicada**: Havia duas funções `findAll` em `accounts-pay.service.ts`. Renomeamos uma para `findMany` para resolver o conflito.
    -   **Tipos e Lógica**: Corrigimos chamadas de métodos com nomes errados e problemas na manipulação de valores do tipo `Decimal`.
8.  **Sucesso!**: Após corrigir os erros de compilação e reconstruir o projeto (`pnpm build`), um teste final enviando a mensagem `/contas a pagar` pelo WhatsApp funcionou perfeitamente, com o backend recebendo, processando e respondendo como esperado.

Este processo de depuração passo a passo foi crucial para identificar e resolver múltiplos problemas independentes que, juntos, impediam a funcionalidade de operar.

## 6. Problemas Adicionais e Resoluções (Pós-Implementação Inicial)

Após a implementação inicial da funcionalidade de consulta de contas a pagar via WhatsApp, surgiram novos desafios que exigiram depuração e ajustes adicionais.

### 6.1. Condição de Corrida na Inicialização (Frontend/Backend)

-   **Problema**: O frontend iniciava antes do backend estar totalmente operacional, resultando em erros `ECONNREFUSED` ao tentar se comunicar com a API.
-   **Solução**: Foi criado um script `scripts/wait-for-port.js` em Node.js para pausar a inicialização do frontend até que o backend estivesse escutando na porta 3002. O script `dev` no `package.json` raiz foi atualizado para incluir essa espera.

### 6.2. Comando `docker-compose` Não Encontrado (Serviço de Backup)

-   **Problema**: O serviço de backup do backend tentava executar comandos Docker usando `docker-compose` (com hífen), que foi reportado como "não encontrado" em ambientes Docker mais recentes que utilizam `docker compose` (com espaço).
-   **Solução**: Todas as ocorrências de `docker-compose` em `apps/backend/src/backups/backups.service.ts` foram substituídas por `docker compose` para se adequar à sintaxe moderna do CLI do Docker.

### 6.3. Falha de Autenticação no Banco de Dados da Evolution API

-   **Problema**: O contêiner `evolution_api` estava em um loop de reinicialização devido ao erro `P1010: User 'postgres' was denied access on the database`. Isso indicava uma incompatibilidade entre as credenciais usadas pela API e as esperadas pelo banco de dados. Foi observado que o `docker-compose.yml` (e não `docker-compose.evolution.yml`) estava em uso, e a persistência de dados antigos no volume do banco de dados causava o conflito.
-   **Solução**: Após a falha na tentativa de usar o endpoint `/chat/send`, e a constatação de que o erro persistia, o problema foi provavelmente resolvido por uma intervenção manual do usuário para redefinir o estado do contêiner da Evolution API, ou por uma re-inicialização completa do ambiente Docker. A ação sugerida foi a remoção do volume `evolution_postgres_data` para forçar uma nova inicialização do banco de dados com as credenciais corretas, o que implicaria na perda de dados de sessão e na necessidade de escanear um novo QR code.

### 6.4. Erro ao Enviar Mensagem do WhatsApp: Propriedade 'text' Ausente (400 Bad Request)

-   **Problema**: A primeira tentativa de enviar uma mensagem de resposta pela Evolution API resultou em `instance requires property "text"`. O backend estava aninhando o texto da mensagem dentro de um objeto `textMessage` (`textMessage: { text: ... }`), enquanto a API esperava a propriedade `text` diretamente no payload.
-   **Solução**: A função `sendWhatsappMessage` em `apps/backend/src/whatsapp/whatsapp.service.ts` foi ajustada para enviar o `text` diretamente no payload (`text: 'sua mensagem'`).

### 6.5. Parsing Incorreto de Valores Monetários em Mensagens

-   **Problema**: Ao receber mensagens de despesa, como "despesa 270.00 Alexandre Almoço", o valor `270.00` era interpretado incorretamente como `27000.00`. A lógica de parsing tratava o ponto como separador de milhares em todos os casos.
-   **Solução**: A lógica de parsing na função `handleDespesa` em `apps/backend/src/whatsapp/whatsapp.service.ts` foi aprimorada para lidar corretamente com formatos numéricos brasileiros (onde a vírgula é o separador decimal e o ponto o de milhares) e formatos decimais padrão. A nova lógica verifica a presença de vírgula para determinar o formato.

### 6.6. Erro ao Enviar Mensagem do WhatsApp: 'exists: false' (400 Bad Request)

-   **Problema**: Após a correção da propriedade `text`, o erro mudou para `{"exists": false, "jid": "..."}`, indicando que a instância da Evolution API não reconhecia o JID do destinatário. Isso é comum quando a sessão do WhatsApp está corrompida ou o contato não foi sincronizado.
-   **Solução**: Foi feita uma tentativa de simplificar o payload removendo o objeto `options`, mas não resolveu o problema.

### 6.7. Erro ao Enviar Mensagem do WhatsApp: 'Cannot POST /chat/send/...' (404 Not Found)

-   **Problema**: Na tentativa de contornar o erro `exists: false`, o endpoint da API para envio de mensagens foi alterado de `/message/sendText` para `/chat/send`. No entanto, este endpoint revelou-se inexistente na Evolution API, resultando em um erro 404.
-   **Solução**: A função `sendWhatsappMessage` foi revertida para utilizar o endpoint original `/message/sendText` e a estrutura de payload que enviava o `text` diretamente. A solução final para o erro `exists: false` (e consequentemente o funcionamento da integração) veio através da **redefinição da sessão da Evolution API**. Isso envolveu a interrupção dos serviços Docker e a remoção do volume `evolution_data`, que armazena os dados da sessão, forçando o usuário a escanear um novo QR code e restabelecer a conexão do WhatsApp.