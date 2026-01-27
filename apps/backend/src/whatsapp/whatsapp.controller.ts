import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Public } from '../auth/public.decorator';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Public()
  @Post('webhook')
  @HttpCode(200)
  handleWebhook(@Body() body: any) {
    void this.whatsappService.handleIncomingMessage(body);
  }
}
