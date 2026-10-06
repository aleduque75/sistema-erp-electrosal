import { Injectable } from '@nestjs/common';
import { HandleTelegramCallbackUseCase } from './handle-telegram-callback.use-case';
import { HandleTelegramMessageUseCase } from './handle-telegram-message.use-case';

@Injectable()
export class HandleTelegramUpdateUseCase {
  constructor(
    private readonly handleTelegramCallbackUseCase: HandleTelegramCallbackUseCase,
    private readonly handleTelegramMessageUseCase: HandleTelegramMessageUseCase,
  ) {}

  async execute(update: any) {
    if (!update) return { ok: true };

    if (update.callback_query) {
      return this.handleTelegramCallbackUseCase.execute(update.callback_query);
    }

    const msg = update.message || update.channel_post;
    if (msg) {
      return this.handleTelegramMessageUseCase.execute(msg);
    }

    return { ok: true };
  }
}
