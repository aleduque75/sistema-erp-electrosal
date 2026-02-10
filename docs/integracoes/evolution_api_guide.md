# Guia de Integração e Depuração da Evolution API

Este guia documenta os passos para configurar, resolver problemas e testar a Evolution API em um ambiente Docker isolado, além de detalhar a saga de depuração para o webhook.

## 1. Estrutura de Arquivos

Para uma melhor organização, separamos a configuração do Docker em dois ambientes distintos:

-   `docker-compose.yml`: Para os serviços principais da aplicação (banco de dados, n8n, etc.).
-   `docker-compose.evolution.yml`: Exclusivamente para a `evolution-api` e seu banco de dados `postgres`.

### `docker-compose.evolution.yml`

Este arquivo define os serviços para a API.

```yaml
version: '3.8'

services:
  evolution_api:
    image: atendai/evolution-api:latest
    container_name: evolution_api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - DATABASE_CONNECTION_URI=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - API_KEY=${EVOLUTION_API_KEY}
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
      - TYPE=local
    depends_on:
      - postgres
    volumes:
      - ./evolution_instances:/app/instances
      - ./evolution_store:/app/store
    networks:
      - evolution_net

  postgres:
    image: postgres:15
    container_name: evolution_postgres
    restart: always
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    ports:
      - "5433:5432"
    volumes:
      - evolution_postgres_data:/var/lib/postgresql/data
    networks:
      - evolution_net

volumes:
  evolution_postgres_data:

networks:
  evolution_net:
    driver: bridge
```

### `.env.evolution`

Criamos um arquivo de ambiente dedicado para as variáveis da Evolution API.

**Importante:** Se sua chave de API (`EVOLUTION_API_KEY`) contiver o caractere `$`, ele precisa ser escapado com um `$` adicional para que o Docker Compose o interprete corretamente. Por exemplo, `minha@senha$` se torna `minha@senha$$`.

```env
# Variáveis de ambiente para a Evolution API
POSTGRES_DB=evolution_db
POSTGRES_USER=evolution_user
POSTGRES_PASSWORD=evolution_pass
EVOLUTION_API_KEY=MelhorFilmeMatrixAinda@$$
```

## 2. Comandos do Docker

### Iniciando o Ambiente

Para iniciar os serviços da Evolution API, use o seguinte comando. Ele especifica o arquivo de compose e o arquivo de ambiente a serem utilizados:

```bash
docker-compose -f docker-compose.evolution.yml --env-file .env.evolution up -d
```

### Resolvendo Problemas Comuns

Se encontrar erros de autenticação com o banco de dados (`P1010: User ... was denied access`), pode ser necessário limpar o volume de dados persistente do Postgres para forçar uma reinicialização limpa.

**Atenção:** Este comando apagará permanentemente os dados do banco de dados da Evolution API.

```bash
# 1. Pare os serviços
docker-compose -f docker-compose.evolution.yml down

# 2. Remova o volume do banco de dados
docker volume rm sistema-erp-electrosal_evolution_postgres_data

# 3. Inicie os serviços novamente
docker-compose -f docker-compose.evolution.yml --env-file .env.evolution up -d
```

## 3. Testando a API

Após iniciar os serviços e conectar sua instância do WhatsApp (ex: `electrosal-bot`), você pode testar o envio de mensagens com o `curl`.

### Comando `curl` para Enviar Mensagem de Texto

O corpo da requisição (`-d`) deve ser um JSON simples contendo o número do destinatário e o texto da mensagem.

```bash
curl -X POST \
  'http://localhost:8080/message/sendText/electrosal-bot' \
  -H 'Content-Type: application/json' \
  -H 'apikey: SuaApiKeyAqui' \
  -d '{
    "number": "55119XXXXXXXX",
    "text": "Olá! Isto é uma mensagem de teste. 🚀"
  }'
```

Substitua `electrosal-bot` pelo nome da sua instância, `SuaApiKeyAqui` pela sua chave (sem o `$$` de escape) e `55119XXXXXXXX` pelo número de destino.

### Resposta de Sucesso

Uma resposta bem-sucedida se parecerá com isto, indicando que a mensagem foi enfileirada para envio:

```json
{
  "key": {
    "remoteJid": "55119XXXXXXXX@s.whatsapp.net",
    "fromMe": true,
    "id": "3EB0271589D235C2AEED0D195932E3B22BCF3F61"
  },
  "pushName": "",
  "status": "PENDING",
  "message": {
    "conversation": "Olá! Isto é uma mensagem de teste. 🚀"
  },
  "contextInfo": null,
  "messageType": "conversation",
  "messageTimestamp": 1769445791,
  "instanceId": "642c0e3f-5c26-4976-95d5-05aeccd24a8d",
  "source": "unknown"
}
```

---

## Saga da Depuração do Webhook da Evolution API

Esta seção documenta a complexa jornada de depuração para fazer o webhook da Evolution API se comunicar com o backend NestJS.

### 1. O Problema Inicial: O Silêncio no Console

*   **Sintoma:** Após implementar o comando `/contas a pagar` no `WhatsappService`, enviamos mensagens para o bot, mas absolutamente nada era registrado no console do backend.
*   **Conclusão:** A requisição de webhook da Evolution API não estava chegando ao nosso backend.

### 2. Investigação Nível 1: A URL do Webhook

Analisamos o arquivo `.env.evolution` e a configuração do backend em `main.ts` para encontrar divergências na `WEBHOOK_GLOBAL_URL`.

*   **Problema A (IP):** A URL apontava para um IP interno do Docker (`172.20.0.1`), que o container não pode usar para alcançar a máquina host.
    *   **Solução:** Encontramos o IP da sua máquina na rede local (`192.168.1.160`) e o utilizamos.
*   **Problema B (Porta):** A URL apontava para a porta `3001`, mas o `main.ts` revelou que o backend estava, na verdade, rodando na porta `3002`.
    *   **Solução:** Corrigimos a porta na URL para `3002`.
*   **Problema C (Prefixo da API):** A URL não continha o prefixo global `/api` que estava configurado no `main.ts` (`app.setGlobalPrefix('api')`).
    *   **Solução:** Adicionamos `/api` ao caminho, resultando na URL final e correta: `http://192.168.1.160:3002/api/whatsapp/webhook`.

### 3. Investigação Nível 2: O Bloqueio de Rede

*   **Sintoma:** Mesmo com a URL 100% correta, o console continuava em silêncio. A suspeita recaiu sobre um firewall.
*   **Diagnóstico:** Entramos no shell do container da `evolution-api` (`docker exec -it evolution_api /bin/sh`) e tentamos nos conectar manualmente ao backend usando `wget`.
*   **Resultado:** O comando `wget -S -O - http://192.168.1.160:3002/api/whatsapp/webhook` retornou um erro `404 Not Found`.
*   **Conclusão:** **Sucesso!** O erro 404 provou que a conexão de rede estava **funcionando**. O container conseguia chegar ao backend, que respondia "Não encontrado" porque o `wget` faz uma requisição `GET` e o endpoint espera uma `POST`. O problema não era um firewall.

### 4. Investigação Nível 3: A Autenticação e Configuração

*   **Sintoma:** A conexão de rede funciona, mas o código do controller ainda não é executado.
*   **Diagnóstico:** O problema estava na validação da chave de API (`apikey`). O backend (que roda com `pnpm dev`) lê as variáveis do arquivo `.env` na raiz do projeto, não do `.env.evolution`. O arquivo `.env` estava com o valor errado para a variável `EVOLUTION_INSTANCE_TOKEN`.
*   **Solução:** Corrigimos o arquivo `.env` principal para conter o `EVOLUTION_INSTANCE_TOKEN` correto, que é usado para validar os webhooks recebidos, e também o `EVOLUTION_API_KEY` correto, que o `WhatsappService` usa para enviar mensagens de volta.

### 5. Situação Atual: O Último Obstáculo

*   **Sintoma:** Mesmo com tudo aparentemente correto, o console ainda não mostra os logs de "Webhook recebido".
*   **Hipótese Final:** Algo no próprio framework NestJS (possivelmente o `ValidationPipe` global ou a configuração de `CORS`) está rejeitando a requisição `POST` da Evolution API *antes* mesmo de chegar à primeira linha de código do nosso método no controller.
*   **Próximo Passo:** Simplificar radicalmente o endpoint do webhook no `whatsapp.controller.ts` para aceitar qualquer requisição, apenas para forçar o aparecimento de um log e confirmar a hipótese.

```