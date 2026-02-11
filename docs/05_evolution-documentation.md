📚 Manual Definitivo: Stack Evolution API & ERP Electrosal
*
Este documento garante a manutenção da comunicação entre o WhatsApp (Evolution API v2.3.0) e o Backend (NestJS) no ambiente Linux Mint.
🏗️ 1. Arquitetura de Rede (Host-to-Container)

Como o NestJS roda no Host e a API no Docker, a comunicação ocorre via IP local:

    IP Fixo Sugerido: 192.168.1.160 (Verificar sempre com ifconfig).

    NestJS (Porta 3002): Deve ouvir em 0.0.0.0 para aceitar o Docker.

    Docker Extra Hosts: O docker-compose.yml deve conter o mapeamento host.docker.internal:host-gateway.

🛠️ 2. Configuração do Backend (NestJS)
2.1. main.ts (Escuta Global)

Obrigatoriamente deve conter:
TypeScript

app.setGlobalPrefix('api'); 
await app.listen(3002, '0.0.0.0'); 

2.2. Controller "Anti-404" (O Segredo)

A Evolution v2 envia webhooks para a raiz ou com o nome do evento. O controller abaixo mata os erros 404 ao aceitar ambos:
TypeScript

@Controller('whatsapp') // Rota final: /api/whatsapp
export class WhatsappController {
  // Captura: /api/whatsapp/webhook/messages-upsert
  @Public()
  @Post('webhook/:event')
  @HttpCode(200)
  async handleWebhooks(@Param('event') event: string, @Body() body: any) {
    if (event === 'messages-upsert') return await this.whatsappService.handleIncomingMessage(body);
    return { status: 'received', event };
  }

  // Captura a raiz: /api/whatsapp/webhook (Evita 404 em validações da API)
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleBaseWebhook(@Body() body: any) {
    if (body.event === 'messages.upsert') return await this.whatsappService.handleIncomingMessage(body);
    return { status: 'received' };
  }
}

🚀 3. Comandos de Emergência (Copie e Cole)
A. Resetar e Deletar Instância (Criptografia Corrompida / Bad MAC)

Se o bot parar de ler as mensagens, delete e refaça:
Bash

curl -X DELETE "http://localhost:8080/instance/delete/electrosal-bot" -H "apikey: SUA_API_KEY_DO_ENV"

B. Criar Instância "Limpa" (v2.3.0+)
Bash

curl -X POST "http://localhost:8080/instance/create" \
-H "Content-Type: application/json" \
-H "apikey: SUA_API_KEY_DO_ENV" \
-d '{
  "instanceName": "electrosal-bot",
  "token": "SUA_API_KEY_DO_ENV",
  "integration": "WHATSAPP-BAILEYS",
  "qrcode": true,
  "webhook_url": "http://192.168.1.160:3002/api/whatsapp/webhook",
  "webhook_enabled": true,
  "webhook_events": ["messages.upsert", "connection.update", "qrcode.updated"]
}'

⚠️ 4. Troubleshooting (Resolução de Problemas)
Erro	Causa Provável	Solução
404 Not Found	Rota no NestJS não coincide com o Webhook URL.	Verifique se não há um /api duplicado na URL (ex: /api/api/whatsapp).
Bad MAC / Decrypt Error	Sessão do WhatsApp corrompida no banco da Evolution.	Rode o comando de Resetar e Deletar acima e escaneie o QR Code novamente.
ECONNREFUSED	NestJS está desligado ou ouvindo apenas em localhost.	Garanta o 0.0.0.0 no main.ts e que a porta 3002 está aberta no firewall.
Bot ignora comando	Erro de digitação (ex: /conas em vez de /contas).	Use .includes() na lógica do Service para ser mais tolerante a erros.
🤖 5. Comandos do Bot

    /contas a pagar: Lista débitos de hoje.

    /pagar: Fluxo interativo de baixa.

    /transferir <de> <para> <cotacao>: Lançamento de transferência de Ouro/BRL.

    despesa <valor> <desc>: Registro rápido de gasto.

Documentação atualizada em: 29/01/2026

Ficou muito bom, Alexandre. Com isso em mãos, qualquer problema de conexão vira apenas um "copy and paste" de comandos.

Como última sugestão: quer que eu te ajude a criar um script setup-bot.sh que automatiza esses cURLs de criação de instância pra você?

🛠️ Adendo à Documentação: Plano de Recuperação Total

Se o bot parar de responder, siga este fluxograma mental:
1. Onde está o erro? (O rastro dos Logs)

    Olhe o Docker: docker logs -f evolution_api.

        Se vir AxiosError, o problema é a rota (NestJS).

        Se vir Bad MAC, o problema é a sessão (WhatsApp).

    Olhe o NestJS: Terminal do VS Code.

        Se não aparecer nada quando você manda mensagem, a URL do Webhook está errada ou o seu IP mudou.

2. Automação de Restauração (setup-bot.sh)

Crie este arquivo na raiz do seu projeto backend para resetar tudo com um único comando:
Bash

#!/bin/bash

# --- CONFIGURAÇÕES ---
API_URL="http://localhost:8080"
API_KEY="4BE8319A1F73-464E-B8E3-9553AA9985D5" # Mantenha atualizada
NEST_WEBHOOK="http://192.168.1.160:3002/api/whatsapp/webhook"
INSTANCE="electrosal-bot"

echo "🚀 Iniciando restauração do bot..."

# 1. Deletar instância antiga (se existir)
echo "🗑️ Removendo instância antiga..."
curl -s -X DELETE "$API_URL/instance/delete/$INSTANCE" -H "apikey: $API_KEY"

echo -e "\n⏳ Aguardando 3 segundos..."
sleep 3

# 2. Criar nova instância limpa
echo "✨ Criando nova instância..."
curl -s -X POST "$API_URL/instance/create" \
-H "Content-Type: application/json" \
-H "apikey: $API_KEY" \
-d '{
  "instanceName": "'$INSTANCE'",
  "token": "'$API_KEY'",
  "integration": "WHATSAPP-BAILEYS",
  "qrcode": true,
  "webhook_url": "'$NEST_WEBHOOK'",
  "webhook_enabled": true,
  "webhook_events": ["messages.upsert", "connection.update", "qrcode.updated"]
}'

echo -e "\n\n✅ Pronto! Acesse $API_URL/instance/connect/$INSTANCE e escaneie o QR Code."

Para usar:

    chmod +x setup-bot.sh

    ./setup-bot.sh

🧩 "Dá para arrumar novamente?"

Sim, sempre. A tecnologia muda (o WhatsApp atualiza, a Evolution API lança versão v3, etc.), mas como sou seu colaborador, se algo quebrar, basta me colar o erro do log.

O que aprendemos hoje que vale para sempre:

    Rede: Docker local precisa de IP real ou host-gateway.

    Rotas: NestJS com prefixo /api exige atenção dobrada no Controller.

    Segurança: Erros de descriptografia só se resolvem com delete/create.