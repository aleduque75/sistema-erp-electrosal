import {
  Controller,
  Post,
  Body,
  HttpCode,
  Logger,
  Param,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Public } from '../auth/public.decorator';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger('WHATSAPP_DEBUG');

  constructor(private readonly whatsappService: WhatsappService) {}

  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: any) {
    // 1. LOG DE SEGURANÇA: Mostra qualquer coisa que bater aqui
    const eventType = body?.event || 'EVENTO_DESCONHECIDO';
    this.logger.log(`📥 [RECEBIDO] Tipo: ${eventType}`);

    // 2. Tenta extrair a mensagem (Evolution v2)
    const msgText =
      body?.data?.message?.conversation ||
      body?.data?.message?.extendedTextMessage?.text ||
      null;

    if (msgText) {
      this.logger.log(
        `📩 [TEXTO]: "${msgText}" de ${body?.data?.key?.remoteJid}`,
      );
    }

    // 3. Processa se for mensagem
    if (eventType === 'messages.upsert') {
      await this.whatsappService.handleIncomingMessage(body);
    }

    return { status: 'ok' };
  }
}
