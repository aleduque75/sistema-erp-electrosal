import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Public } from '../auth/public.decorator';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger('WHATSAPP_FINAL');

  constructor(private readonly whatsappService: WhatsappService) {}

  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: any) {
    // Log para confirmar que a "Webhook by Events" foi desligada com sucesso
    this.logger.log(`📥 Evento Recebido: ${body.event}`);

    if (body.event === 'messages.upsert') {
      const msgText =
        body.data?.message?.conversation ||
        body.data?.message?.extendedTextMessage?.text ||
        'Mídia ou Formato Especial';

      this.logger.log(
        `📩 [MENSAGEM]: "${msgText}" de ${body.data?.key?.remoteJid}`,
      );

      // Envia para o serviço processar a resposta
      await this.whatsappService.handleIncomingMessage(body);
    }

    return { status: 'received' };
  }
}
