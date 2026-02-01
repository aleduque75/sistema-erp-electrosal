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
    this.logger.log(`📢 Webhook [${event}] recebido.`);
    if (event === 'messages-upsert') {
      await this.whatsappService.handleIncomingMessage(body);
    }
    return { status: 'received', event };
  }

  // 2. CAPTURA A ROTA RAIZ (Resolve o 404 da Evolution v2)
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleBaseWebhook(@Body() body: any) {
    this.logger.log(`📢 Webhook raiz recebido (Evento: ${body.event})`);
    if (body.event === 'messages.upsert') {
      await this.whatsappService.handleIncomingMessage(body);
    }
    return { status: 'received' };
  }

  @Public()
  @Get('qrcode')
  getQrCode(): { qrCode: string | null } {
    return { qrCode: this.whatsappService.getLatestQrCode() };
  }
}
