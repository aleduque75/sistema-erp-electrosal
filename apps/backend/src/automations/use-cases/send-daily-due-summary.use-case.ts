import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramBotService } from '../services/telegram-bot.service';

@Injectable()
export class SendDailyDueSummaryUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  async execute(targetChatId?: string) {
    const organizationId = this.telegramBotService.getOrganizationId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const [quoteAu, quoteAg] = await Promise.all([
      this.telegramBotService.getQuotationForDate(new Date(), 'AU'),
      this.telegramBotService.getQuotationForDate(new Date(), 'AG'),
    ]);
    const goldPrice = quoteAu.price || 715;
    const silverPrice = quoteAg.price || 6.5;

    const includeSale = {
      sale: {
        include: {
          pessoa: true,
          metalReceivable: true,
          saleItems: {
            include: {
              product: {
                include: {
                  productGroup: true,
                },
              },
            },
          },
        },
      },
    };

    // 1. Vencem Hoje
    const vencemHoje = await this.prisma.accountRec.findMany({
      where: {
        organizationId,
        received: false,
        dueDate: { gte: today, lte: endOfToday },
      },
      include: includeSale,
      orderBy: { dueDate: 'asc' },
    });

    // 2. Vencidos (Anteriores a hoje)
    const vencidos = await this.prisma.accountRec.findMany({
      where: {
        organizationId,
        received: false,
        dueDate: { lt: today },
      },
      include: includeSale,
      orderBy: { dueDate: 'asc' },
    });

    if (vencemHoje.length === 0 && vencidos.length === 0 && !targetChatId) {
      return;
    }

    let totalHoje = 0;
    let goldHoje = 0;
    let silverHoje = 0;
    vencemHoje.forEach((item) => {
      const info = this.telegramBotService.resolveReceivableInfo(item, goldPrice, silverPrice);
      totalHoje += info.pendente;
      if (info.isSilver) {
        silverHoje += info.metalGrams;
      } else {
        goldHoje += info.metalGrams;
      }
    });

    let totalVenc = 0;
    let goldVenc = 0;
    let silverVenc = 0;
    vencidos.forEach((item) => {
      const info = this.telegramBotService.resolveReceivableInfo(item, goldPrice, silverPrice);
      totalVenc += info.pendente;
      if (info.isSilver) {
        silverVenc += info.metalGrams;
      } else {
        goldVenc += info.metalGrams;
      }
    });

    const dataHojeFormatada = new Date().toLocaleDateString('pt-BR');
    let text = `🌅 *RESUMO DIÁRIO DE COBRANÇAS - ERP ELECTROSAL*\n📅 *${dataHojeFormatada}*\n\n`;

    if (vencemHoje.length > 0) {
      text += `⏰ *VENCEM HOJE (${vencemHoje.length} título${vencemHoje.length > 1 ? 's' : ''}):*\n`;
      vencemHoje.slice(0, 5).forEach((h) => {
        const info = this.telegramBotService.resolveReceivableInfo(h, goldPrice, silverPrice);
        const num = h.sale?.orderNumber ? `#${h.sale.orderNumber}` : 'Venda';
        const cli = (h.sale?.pessoa?.name || h.description || 'Cliente').replace(/[*_`]/g, '');
        const metalTag = info.metalGrams > 0 ? ` (${info.metalGrams.toFixed(info.isSilver ? 2 : 3)} g ${info.metalUnit})` : '';
        text += `• ${num} - ${cli}: *R$ ${info.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*${metalTag}\n`;
      });
      if (vencemHoje.length > 5) {
        text += `_... e mais ${vencemHoje.length - 5} título(s) hoje_\n`;
      }
      const hojeMetalParts: string[] = [];
      if (goldHoje > 0.001) hojeMetalParts.push(`${goldHoje.toFixed(3)} g Au`);
      if (silverHoje > 0.001) hojeMetalParts.push(`${silverHoje.toFixed(2)} g Ag`);
      const hojeMetalStr = hojeMetalParts.length > 0 ? ` (${hojeMetalParts.join(' | ')})` : '';
      text += `💰 Previsto para hoje: *R$ ${totalHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*${hojeMetalStr}\n\n`;
    } else {
      text += `⏰ *VENCEM HOJE:* Nenhum título previsto para hoje.\n\n`;
    }

    if (vencidos.length > 0) {
      text += `🔴 *EM ATRASO / VENCIDOS (${vencidos.length} título${vencidos.length > 1 ? 's' : ''}):*\n`;
      vencidos.slice(0, 5).forEach((v) => {
        const info = this.telegramBotService.resolveReceivableInfo(v, goldPrice, silverPrice);
        const num = v.sale?.orderNumber ? `#${v.sale.orderNumber}` : 'Venda';
        const cli = (v.sale?.pessoa?.name || v.description || 'Cliente').replace(/[*_`]/g, '');
        const diffTime = today.getTime() - new Date(v.dueDate).getTime();
        const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        const metalTag = info.metalGrams > 0 ? ` (${info.metalGrams.toFixed(info.isSilver ? 2 : 3)} g ${info.metalUnit})` : '';
        text += `• ${num} - ${cli}: *R$ ${info.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*${metalTag} (⚠️ ${diffDays}d)\n`;
      });
      if (vencidos.length > 5) {
        text += `_... e mais ${vencidos.length - 5} título(s) em atraso_\n`;
      }
      const vencMetalParts: string[] = [];
      if (goldVenc > 0.001) vencMetalParts.push(`${goldVenc.toFixed(3)} g Au`);
      if (silverVenc > 0.001) vencMetalParts.push(`${silverVenc.toFixed(2)} g Ag`);
      const vencMetalStr = vencMetalParts.length > 0 ? ` (${vencMetalParts.join(' | ')})` : '';
      text += `⚠️ Total em atraso: *R$ ${totalVenc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*${vencMetalStr}\n\n`;
    } else {
      text += `🎉 *VENCIDOS:* Nenhum título em atraso!\n\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━\n💡 _Abra a Central de Cobranças para ver os detalhes ou registrar baixas no sistema._`;

    const inline_keyboard = [
      [{ text: '⚠️ Abrir Central de Cobranças', callback_data: 'menu_cobrancas' }],
      [{ text: '📱 Menu Principal', callback_data: 'menu_principal' }],
    ];

    if (targetChatId) {
      await this.telegramBotService.callTelegramApi('sendMessage', {
        chat_id: targetChatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
    } else {
      const chats = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT DISTINCT chat_id FROM erp.telegram_sessions WHERE chat_id IS NOT NULL`,
      );
      if (chats && chats.length > 0) {
        for (const c of chats) {
          await this.telegramBotService.callTelegramApi('sendMessage', {
            chat_id: c.chat_id,
            text,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard },
          });
        }
      }
    }
  }
}
