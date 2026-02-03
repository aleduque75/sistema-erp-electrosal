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
  private readonly logger = new Logger('WHATSAPP_DEBUG');

  constructor(private readonly whatsappService: WhatsappService) {}

  /**
   * 1. Captura chamadas com sufixo (ex: webhook/messages-upsert)
   * Útil para versões da Evolution que usam parâmetros na URL.
   */
  @Public()
  @Post('webhook/:event')
  @HttpCode(200)
  async handleWebhooks(@Param('event') event: string, @Body() body: any) {
    const normalizedEvent = event.toLowerCase().replace('-', '.');

    // Log de diagnóstico
    this.logger.log(
      `📦 https://dictionary.cambridge.org/dictionary/portuguese-english/dinamica Evento: ${normalizedEvent}`,
    );
    this.logger.log(`🔍 [DADO BRUTO]: ${JSON.stringify(body)}`);

    if (normalizedEvent === 'messages.upsert') {
      this.extractAndLogMessage(body);
      await this.whatsappService.handleIncomingMessage(body);
    }

    return { status: 'ok', event: normalizedEvent };
  }

  /**
   * 2. CAPTURA A ROTA RAIZ (Padrão Evolution v2)
   * Esta é a rota que você configurou no painel: /api/whatsapp/webhook
   */
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleBaseWebhook(@Body() body: any) {
    const event = (body.event || 'unknown').toLowerCase();

    // LOG CRUCIAL: Mostra tudo o que a Evolution enviar para o seu PM2
    this.logger.log(`📦 [ROTA RAIZ] Evento Recebido: ${body.event}`);
    this.logger.log(`🔍 [DADO BRUTO]: ${JSON.stringify(body)}`);

    if (event === 'messages.upsert') {
      this.extractAndLogMessage(body);
      await this.whatsappService.handleIncomingMessage(body);
    }

    return { status: 'ok' };
  }

  /**
   * Função auxiliar para limpar o log e mostrar apenas o texto da mensagem.
   */
  private extractAndLogMessage(body: any) {
    try {
      const message =
        body.data?.message?.conversation ||
        body.data?.message?.extendedTextMessage?.text ||
        body.data?.message?.imageMessage?.caption ||
        'Mensagem sem texto detectado (Mídia ou formato especial)';

      const sender = body.data?.key?.remoteJid || 'Remetente Desconhecido';

      this.logger.log(
        `📩 [MENSAGEM IDENTIFICADA] De: ${sender} | Texto: "${message}"`,
      );
    } catch (e) {
      this.logger.error('❌ Erro ao processar o conteúdo para log');
    }
  }

  @Public()
  @Get('qrcode')
  getQrCode(): { qrCode: string | null } {
    return { qrCode: this.whatsappService.getLatestQrCode() };
  }
}
