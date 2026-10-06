import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramBotService } from '../services/telegram-bot.service';

@Injectable()
export class HandleOrderLookupUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  async execute(
    chatId: string,
    orderNum: number,
    session: any,
    messageId?: number,
  ) {
    const organizationId = this.telegramBotService.getOrganizationId();
    const sessionData = session?.data || {};

    const [quoteAu, quoteAg] = await Promise.all([
      this.telegramBotService.getQuotationForDate(new Date(), 'AU'),
      this.telegramBotService.getQuotationForDate(new Date(), 'AG'),
    ]);
    const auPrice = quoteAu.price || 715;
    const agPrice = quoteAg.price || 6.5;

    const sale = await this.prisma.sale.findFirst({
      where: {
        organizationId,
        orderNumber: orderNum,
      },
      include: {
        pessoa: true,
        accountsRec: true,
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
    });

    if (!sale) {
      const errorText = `⚠️ *Pedido #${orderNum} não encontrado no sistema.*\n\nVerifique o número e tente novamente, ou digite outro número diretamente aqui:`;
      const errorKeyboard = [
        [{ text: '🔍 Tentar Outro Número', callback_data: 'buscar_num_pedido' }],
        [{ text: '📦 Ver Pedidos em Aberto', callback_data: 'sub_rec_pedidos' }],
        [{ text: '⬅️ Menu Principal', callback_data: 'menu_principal' }],
      ];

      if (messageId) {
        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: errorText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: errorKeyboard },
        });
      } else {
        await this.telegramBotService.callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: errorText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: errorKeyboard },
        });
      }
      return { ok: true };
    }

    sessionData.selectedSaleId = sale.id;
    sessionData.selectedOrderNumber = sale.orderNumber;
    sessionData.waitingFor = null;
    await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

    const cli = (sale.pessoa?.name || 'Cliente').replace(/[*_`]/g, '');
    const dataCriacao = new Date(sale.createdAt).toLocaleDateString('pt-BR');
    const tel = sale.pessoa?.phone ? `\n• *Telefone:* ${sale.pessoa.phone}` : '';

    // Avaliar contas a receber e status de pagamento
    const pendingAccount = sale.accountsRec.find((ar) => !ar.received);
    const hasAnyAccount = sale.accountsRec.length > 0;
    const allReceived = hasAnyAccount && sale.accountsRec.every((ar) => ar.received);

    let valStr = '';
    let metalTag = '';

    if (pendingAccount) {
      const info = this.telegramBotService.resolveReceivableInfo(pendingAccount, auPrice, agPrice);
      valStr = `R$ ${info.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      if (info.metalGrams > 0) {
        metalTag = ` (${info.metalGrams.toFixed(info.isSilver ? 2 : 3)} g ${info.metalUnit})`;
      }
    } else {
      const net = Number(sale.netAmount || sale.totalAmount || 0);
      valStr = `R$ ${net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      if (sale.goldValue && Number(sale.goldValue) > 0) {
        metalTag = ` (${Number(sale.goldValue).toFixed(3)} g Au)`;
      }
    }

    let statusDesc = '';
    if (allReceived) {
      statusDesc = '🟢 *Totalmente Recebido / Quitado*';
    } else if (pendingAccount) {
      const dStr = new Date(pendingAccount.dueDate).toLocaleDateString('pt-BR');
      statusDesc = `🔴 *Pendente de Recebimento* (Venc: ${dStr})`;
    } else if (sale.paymentMethod === 'A_VISTA') {
      statusDesc = '🟢 *Pago à Vista*';
    } else {
      statusDesc = `🟡 *Pendente (${sale.status})*`;
    }

    let text = `📦 *DETALHES DO PEDIDO #${sale.orderNumber}*\n\n`;
    text += `• *Cliente:* ${cli}${tel}\n`;
    text += `• *Data da Venda:* ${dataCriacao}\n`;
    text += `• *Valor:* *${valStr}*${metalTag}\n`;
    text += `• *Forma de Pagto:* ${sale.paymentMethod || 'A Combinar'}\n`;
    text += `• *Situação:* ${statusDesc}\n\n`;

    const inline_keyboard: any[] = [];

    if (!allReceived) {
      text += `Deseja registrar o recebimento deste pedido agora?`;
      inline_keyboard.push([
        { text: '💰 Registrar Recebimento / Dar Baixa', callback_data: `sel_ped_sale_${sale.id}` },
      ]);
    } else {
      text += `ℹ️ *Este pedido já consta como quitado no sistema.*`;
    }

    inline_keyboard.push([
      { text: '🔍 Buscar Outro Pedido', callback_data: 'buscar_num_pedido' },
      { text: '⬅️ Menu Principal', callback_data: 'menu_principal' },
    ]);

    if (messageId) {
      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
    } else {
      await this.telegramBotService.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
    }
    return { ok: true };
  }
}
