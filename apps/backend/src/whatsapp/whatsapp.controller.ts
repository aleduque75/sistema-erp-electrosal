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

  @Public()
  @Post('webhook/:event')
  @HttpCode(200)
  async handleWebhooks(@Param('event') event: string, @Body() body: any) {
    const normalizedEvent = event.toLowerCase().replace('-', '.');
    this.logger.log(`📢 Webhook dinâmico [${normalizedEvent}] recebido.`);

    if (normalizedEvent === 'messages.upsert') {
      this.logMessageContent(body);
      await this.whatsappService.handleIncomingMessage(body);
    }
    return { status: 'received', event: normalizedEvent };
  }

  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleBaseWebhook(@Body() body: any) {
    // Evolution v2 pode mandar o nome do evento em maiúsculo ou minúsculo
    const event = (body.event || 'unknown').toLowerCase();
    this.logger.log(`📢 Webhook raiz recebido (Evento: ${body.event})`);

    if (event === 'messages.upsert') {
      this.logMessageContent(body);
      await this.whatsappService.handleIncomingMessage(body);
    }
    return { status: 'received' };
  }

  private logMessageContent(body: any) {
    try {
      // Tenta capturar o texto de diferentes formatos da Evolution API
      const message =
        body.data?.message?.conversation ||
        body.data?.message?.extendedTextMessage?.text ||
        body.data?.message?.imageMessage?.caption ||
        'Mensagem sem texto ou formato não mapeado';

      const sender = body.data?.key?.remoteJid || 'Desconhecido';

      // MUDANÇA CRUCIAL: Usando .log em vez de .debug para garantir que apareça no PM2
      this.logger.log(`📩 CONTEÚDO RECEBIDO de [${sender}]: ${message}`);
    } catch (e) {
      this.logger.error('❌ Erro ao processar o texto da mensagem para o log');
    }
  }

  @Public()
  @Get('qrcode')
  getQrCode(): { qrCode: string | null } {
    return { qrCode: this.whatsappService.getLatestQrCode() };
  }
}
