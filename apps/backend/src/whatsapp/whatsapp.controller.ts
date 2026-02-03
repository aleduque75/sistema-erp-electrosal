import {
  Controller,
  Post,
  Body,
  HttpCode,
  Get,
  Logger,
  Param,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Public } from '../auth/public.decorator';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  // 1. Captura chamadas com sufixo (ex: webhook/messages-upsert)
  @Public()
  @Post('webhook/:event')
  @HttpCode(200)
  async handleWebhooks(@Param('event') event: string, @Body() body: any) {
    // Normaliza o evento para aceitar com ponto ou traço
    const normalizedEvent = event.replace('-', '.');
    this.logger.log(`📢 Webhook dinâmico [${normalizedEvent}] recebido.`);

    if (normalizedEvent === 'messages.upsert') {
      this.logMessageContent(body); // Loga o texto da mensagem no terminal
      await this.whatsappService.handleIncomingMessage(body);
    }
    return { status: 'received', event: normalizedEvent };
  }

  // 2. CAPTURA A ROTA RAIZ (Resolve o 404 da Evolution v2)
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleBaseWebhook(@Body() body: any) {
    const event = body.event || 'unknown';
    this.logger.log(`📢 Webhook raiz recebido (Evento: ${event})`);

    // Evolution v2 usa messages.upsert
    if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
      this.logMessageContent(body); // Loga o texto da mensagem no terminal
      await this.whatsappService.handleIncomingMessage(body);
    }
    return { status: 'received' };
  }

  // Função auxiliar para você ver o que está chegando no terminal
  private logMessageContent(body: any) {
    try {
      const message =
        body.data?.message?.conversation ||
        body.data?.message?.extendedTextMessage?.text ||
        'Mensagem sem texto (ex: imagem/áudio)';
      const sender = body.data?.key?.remoteJid || 'Desconhecido';
      this.logger.debug(`📩 Conteúdo da Mensagem de [${sender}]: ${message}`);
    } catch (e) {
      this.logger.error('❌ Erro ao ler conteúdo da mensagem no log');
    }
  }

  @Public()
  @Get('qrcode')
  getQrCode(): { qrCode: string | null } {
    return { qrCode: this.whatsappService.getLatestQrCode() };
  }
}
