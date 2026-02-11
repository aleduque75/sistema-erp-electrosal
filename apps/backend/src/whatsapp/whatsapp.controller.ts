import { Controller, Post, Body, HttpCode, Get, Logger } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Public } from '../auth/public.decorator';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger('WHATSAPP_FINAL');

  constructor(private readonly whatsappService: WhatsappService) {}

  /**
   * Rota principal do Webhook: /api/whatsapp/webhook
   * Configurada para capturar todos os eventos da Evolution API.
   */
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: any) {
    // 1. Log de entrada para monitoramento no PM2
    const event = body.event || 'unknown';
    this.logger.log(`📥 Evento Recebido: ${event}`);

    // 2. Filtro específico para novas mensagens
    if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
      this.processIncomingMessage(body);

      // Envia para o serviço processar a lógica de negócio (IA/Banco de Dados)
      await this.whatsappService.handleIncomingMessage(body);
    }

    return { status: 'received' };
  }

  /**
   * Função auxiliar para extrair e exibir o texto da mensagem no log.
   * Suporta o formato de objeto único e o formato de array da v2.
   */
  private processIncomingMessage(body: any) {
    try {
      // Evolution v2 pode enviar em body.data ou body.data.messages[0]
      const messageData = body.data?.messages?.[0] || body.data;
      const messageContent = messageData?.message;

      const text =
        messageContent?.conversation ||
        messageContent?.extendedTextMessage?.text ||
        messageContent?.imageMessage?.caption ||
        'Conteúdo sem texto (mídia ou outro formato)';

      const sender = messageData?.key?.remoteJid || 'Desconhecido';

      this.logger.log(`📩 [MENSAGEM] De: ${sender} | Texto: "${text}"`);
    } catch (error) {
      this.logger.error('❌ Erro ao extrair conteúdo da mensagem para o log');
    }
  }

  /**
   * Rota para buscar o QR Code atual, se necessário.
   */
  @Public()
  @Get('qrcode')
  getQrCode(): { qrCode: string | null } {
    return { qrCode: this.whatsappService.getLatestQrCode() };
  }
}
