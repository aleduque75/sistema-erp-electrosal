import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger // <--- ADICIONE ISSO AQUI
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name); // <--- E ISSO AQUI

  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('webhook{/*path}')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any, @Headers() headers: any) {
    const incomingKey = headers['apikey'] || payload.apikey;
    const expectedKey = process.env.EVOLUTION_INSTANCE_TOKEN; // Lê o token da instância da variável de ambiente

    this.logger.log(`Incoming API Key: ${incomingKey}`);
    this.logger.log(`Expected API Key: ${expectedKey}`);

    if (incomingKey !== expectedKey) {
      return { status: 'error', message: 'Unauthorized' };
    }

    if (payload.event === 'messages.upsert') { // Corrigido para minúsculas
      await this.whatsappService.processIncomingMessage(payload);
    } else {
      this.logger.log(`Evento de webhook ignorado: ${payload.event}`); // Loga eventos ignorados
    }

    return { status: 'success' };
  }
}
