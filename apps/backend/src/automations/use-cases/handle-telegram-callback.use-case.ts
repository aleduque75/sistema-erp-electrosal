import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramBotService } from '../services/telegram-bot.service';
import { ReceiptLookupUseCase } from './receipt-lookup.use-case';
import { SettleSaleAutomationUseCase } from './settle-sale-automation.use-case';
import { TransferToSupplierUseCase } from './transfer-to-supplier.use-case';
import { CreateDirectExpenseUseCase } from './create-direct-expense.use-case';
import { HandleOrderLookupUseCase } from './handle-order-lookup.use-case';
import { SplitAccountRecUseCase } from '../../accounts-rec/use-cases/split-account-rec.use-case';
import Decimal from 'decimal.js';

@Injectable()
export class HandleTelegramCallbackUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramBotService: TelegramBotService,
    private readonly receiptLookupUseCase: ReceiptLookupUseCase,
    private readonly settleSaleAutomationUseCase: SettleSaleAutomationUseCase,
    private readonly transferToSupplierUseCase: TransferToSupplierUseCase,
    private readonly createDirectExpenseUseCase: CreateDirectExpenseUseCase,
    private readonly handleOrderLookupUseCase: HandleOrderLookupUseCase,
    private readonly splitAccountRecUseCase: SplitAccountRecUseCase,
  ) {}

  async execute(cb: any) {
    const chatId = cb.message?.chat?.id || cb.from?.id;
    const messageId = cb.message?.message_id;
    const data = cb.data || '';

    const session = await this.telegramBotService.getTelegramSession(chatId);
    const sessionData = session.data || {};

    if (data === 'cancelar') {
      await this.telegramBotService.clearTelegramSession(chatId);
      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: '❌ *Operação cancelada.* Digite `menu` ou envie um comprovante quando quiser recomeçar.',
        parse_mode: 'Markdown',
      });
      return { ok: true };
    }

    if (data === 'menu_principal') {
      sessionData.waitingFor = null;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      let text = '🏢 *ELECTROSAL - GESTÃO FINANCEIRA*\n\n';
      if (session.fileId) {
        text += '📸 *Comprovante em anexo na sessão!*\n\n';
      }
      text += 'Escolha a operação que deseja realizar:';

      const inline_keyboard = [
        [
          { text: '💰 Recebimento de Cliente', callback_data: 'menu_rec' },
          { text: '💸 Pagamento / Despesa', callback_data: 'menu_desp' },
        ],
        [
          { text: '⚠️ Cobranças / Vencimentos', callback_data: 'menu_cobrancas' },
          { text: '📊 Cotações de Hoje', callback_data: 'menu_cotacoes' },
        ],
        [{ text: '❌ Cancelar', callback_data: 'cancelar' }],
      ];

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data === 'menu_cobrancas') {
      const organizationId = this.telegramBotService.getOrganizationId();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      const next7Days = new Date(today);
      next7Days.setDate(next7Days.getDate() + 7);
      next7Days.setHours(23, 59, 59, 999);

      const totalVencidos = await this.prisma.accountRec.count({
        where: {
          organizationId,
          received: false,
          dueDate: { lt: today },
        },
      });

      const totalVencemHoje = await this.prisma.accountRec.count({
        where: {
          organizationId,
          received: false,
          dueDate: { gte: today, lte: endOfToday },
        },
      });

      const totalProx7Dias = await this.prisma.accountRec.count({
        where: {
          organizationId,
          received: false,
          dueDate: { gte: today, lte: next7Days },
        },
      });

      let text = '⚠️ *CENTRAL DE COBRANÇAS E VENCIMENTOS*\n\n';
      text += `• 🔴 *Vencidos (Em Atraso):* ${totalVencidos} título(s)\n`;
      text += `• ⏰ *Vencem Hoje:* ${totalVencemHoje} título(s)\n`;
      text += `• 📅 *A Vencer (Próximos 7 Dias):* ${totalProx7Dias} título(s)\n\n`;
      text += 'Selecione uma opção para gerenciar:';

      const inline_keyboard = [
        [{ text: `🔴 Ver Vencidos (${totalVencidos})`, callback_data: 'cobranca_vencidos' }],
        [{ text: `⏰ Ver a Vencer (${totalProx7Dias})`, callback_data: 'cobranca_avencer' }],
        [{ text: '⬅️ Voltar ao Menu Principal', callback_data: 'menu_principal' }],
      ];

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data === 'cobranca_vencidos') {
      const organizationId = this.telegramBotService.getOrganizationId();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [quoteAu, quoteAg] = await Promise.all([
        this.telegramBotService.getQuotationForDate(new Date(), 'AU'),
        this.telegramBotService.getQuotationForDate(new Date(), 'AG'),
      ]);
      const auPrice = quoteAu.price || 715;
      const agPrice = quoteAg.price || 6.5;

      const vencidos = await this.prisma.accountRec.findMany({
        where: {
          organizationId,
          received: false,
          dueDate: { lt: today },
        },
        include: {
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
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      });

      sessionData.cachedVencidos = vencidos;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      let text = '🔴 *TÍTULOS VENCIDOS / EM ATRASO*\n\n';
      const inline_keyboard: any[] = [];

      if (vencidos.length === 0) {
        text += '🎉 *Parabéns! Não há nenhum título vencido no momento.*\n';
      } else {
        let somaValor = 0;
        let somaAu = 0;
        let somaAg = 0;

        vencidos.forEach((item, idx) => {
          const info = this.telegramBotService.resolveReceivableInfo(item, auPrice, agPrice);
          somaValor += info.pendente;
          if (info.isSilver) {
            somaAg += info.metalGrams;
          } else {
            somaAu += info.metalGrams;
          }

          const diffTime = today.getTime() - new Date(item.dueDate).getTime();
          const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
          const cli = (item.sale?.pessoa?.name || item.description || 'Cliente').replace(/[*_`]/g, '');
          const num = item.sale?.orderNumber ? `#${item.sale.orderNumber}` : 'Venda';
          const valStr = info.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

          inline_keyboard.push([
            {
              text: `🔴 ${num} - ${cli.slice(0, 14)}: R$ ${valStr} (${diffDays}d)`,
              callback_data: `venc_det_${idx}`,
            },
          ]);
        });

        const metalParts: string[] = [];
        if (somaAu > 0.001) metalParts.push(`${somaAu.toFixed(3)} g Au`);
        if (somaAg > 0.001) metalParts.push(`${somaAg.toFixed(2)} g Ag`);
        const metalStr = metalParts.length > 0 ? ` (${metalParts.join(' | ')})` : '';

        text += `📊 *Total em atraso:* *R$ ${somaValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*${metalStr}\n`;
        text += `Exibindo os *${vencidos.length}* títulos com maior atraso.\nClique para ver detalhes ou baixar:`;
      }

      inline_keyboard.push([
        { text: '⬅️ Voltar às Cobranças', callback_data: 'menu_cobrancas' },
        { text: '⬅️ Menu Principal', callback_data: 'menu_principal' },
      ]);

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data.startsWith('venc_det_')) {
      const idx = parseInt(data.replace('venc_det_', ''), 10);
      const item = (sessionData.cachedVencidos || [])[idx];
      if (item) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [quoteAu, quoteAg] = await Promise.all([
          this.telegramBotService.getQuotationForDate(new Date(), 'AU'),
          this.telegramBotService.getQuotationForDate(new Date(), 'AG'),
        ]);
        const info = this.telegramBotService.resolveReceivableInfo(item, quoteAu.price || 715, quoteAg.price || 6.5);
        const diffTime = today.getTime() - new Date(item.dueDate).getTime();
        const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        const num = item.sale?.orderNumber ? `#${item.sale.orderNumber}` : 'Venda';
        const cli = (item.sale?.pessoa?.name || item.description || 'Cliente').replace(/[*_`]/g, '');
        const dStr = new Date(item.dueDate).toLocaleDateString('pt-BR');
        const tel = item.sale?.pessoa?.phone ? `\n• Contato: *${item.sale.pessoa.phone}*` : '';
        const metalTag = info.metalGrams > 0 ? ` (${info.metalGrams.toFixed(info.isSilver ? 2 : 3)} g ${info.metalUnit})` : '';

        const text = `🔴 *DETALHES DO TÍTULO VENCIDO*\n\n• Pedido: *${num}*\n• Cliente: *${cli}*${tel}\n• Valor: *R$ ${info.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*${metalTag}\n• Data de Vencimento: *${dStr}*\n• Situação: ⚠️ *Vencido há ${diffDays} dia(s)*\n\nDeseja dar baixa neste recebimento?`;
        const inline_keyboard = [
          [{ text: '💰 Dar Baixa / Receber Agora', callback_data: `bx_venc_${idx}` }],
          [{ text: '⬅️ Voltar aos Vencidos', callback_data: 'cobranca_vencidos' }],
        ];

        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }
    }

    if (data.startsWith('bx_venc_')) {
      const idx = parseInt(data.replace('bx_venc_', ''), 10);
      const item = (sessionData.cachedVencidos || [])[idx];
      if (item) {
        sessionData.selectedSaleId = item.saleId || item.id;
        sessionData.selectedOrderNumber = item.sale?.orderNumber;
        await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

        const [quoteAu, quoteAg] = await Promise.all([
          this.telegramBotService.getQuotationForDate(new Date(), 'AU'),
          this.telegramBotService.getQuotationForDate(new Date(), 'AG'),
        ]);
        const info = this.telegramBotService.resolveReceivableInfo(item, quoteAu.price || 715, quoteAg.price || 6.5);
        const num = item.sale?.orderNumber ? `#${item.sale.orderNumber}` : 'Venda';
        const cli = (item.sale?.pessoa?.name || item.description || 'Cliente').replace(/[*_`]/g, '');
        const metalTag = info.metalGrams > 0 ? ` (${info.metalGrams.toFixed(info.isSilver ? 2 : 3)} g ${info.metalUnit})` : '';

        const text = `🏦 *DESTINO DO PAGAMENTO*\n\nPedido: *${num}* (${cli})\nValor: *R$ ${info.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*${metalTag}\n\nEm qual conta o cliente efetuou o depósito?`;
        const inline_keyboard = [
          [
            { text: '🏦 Caixa Itaú', callback_data: 'bx_itau' },
            { text: '💵 Caixa Dinheiro', callback_data: 'bx_dinheiro' },
          ],
          [
            { text: '🧾 Cheques', callback_data: 'bx_cheques' },
            { text: '🏭 Fornecedor BSA', callback_data: 'bx_bsa' },
          ],
          [{ text: '🔍 Outra Conta Corrente', callback_data: 'bx_buscar_conta' }],
          [{ text: '⬅️ Voltar aos Vencidos', callback_data: 'cobranca_vencidos' }],
        ];

        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }
    }

    if (data === 'cobranca_avencer') {
      const organizationId = this.telegramBotService.getOrganizationId();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const next7Days = new Date(today);
      next7Days.setDate(next7Days.getDate() + 7);
      next7Days.setHours(23, 59, 59, 999);

      const [quoteAu, quoteAg] = await Promise.all([
        this.telegramBotService.getQuotationForDate(new Date(), 'AU'),
        this.telegramBotService.getQuotationForDate(new Date(), 'AG'),
      ]);
      const auPrice = quoteAu.price || 715;
      const agPrice = quoteAg.price || 6.5;

      const aVencer = await this.prisma.accountRec.findMany({
        where: {
          organizationId,
          received: false,
          dueDate: {
            gte: today,
            lte: next7Days,
          },
        },
        include: {
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
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      });

      sessionData.cachedAVencer = aVencer;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      let text = '⏰ *TÍTULOS A VENCER (HOJE E PRÓXIMOS 7 DIAS)*\n\n';
      const inline_keyboard: any[] = [];

      if (aVencer.length === 0) {
        text += 'ℹ️ *Nenhum título previsto para os próximos 7 dias.*\n';
      } else {
        let somaValor = 0;
        let somaAu = 0;
        let somaAg = 0;

        aVencer.forEach((item, idx) => {
          const info = this.telegramBotService.resolveReceivableInfo(item, auPrice, agPrice);
          somaValor += info.pendente;
          if (info.isSilver) {
            somaAg += info.metalGrams;
          } else {
            somaAu += info.metalGrams;
          }

          const dStr = new Date(item.dueDate).toLocaleDateString('pt-BR');
          const isHoje = new Date(item.dueDate).toDateString() === today.toDateString();
          const cli = (item.sale?.pessoa?.name || item.description || 'Cliente').replace(/[*_`]/g, '');
          const num = item.sale?.orderNumber ? `#${item.sale.orderNumber}` : 'Venda';
          const valStr = info.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
          const tag = isHoje ? '⏰ HOJE' : dStr;

          inline_keyboard.push([
            {
              text: `${isHoje ? '⚡' : '📅'} ${num} - ${cli.slice(0, 12)}: R$ ${valStr} (${tag})`,
              callback_data: `avenc_det_${idx}`,
            },
          ]);
        });

        const metalParts: string[] = [];
        if (somaAu > 0.001) metalParts.push(`${somaAu.toFixed(3)} g Au`);
        if (somaAg > 0.001) metalParts.push(`${somaAg.toFixed(2)} g Ag`);
        const metalStr = metalParts.length > 0 ? ` (${metalParts.join(' | ')})` : '';

        text += `📊 *Total previsto:* *R$ ${somaValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*${metalStr}\n`;
        text += `Clique para ver detalhes ou registrar baixa:`;
      }

      inline_keyboard.push([
        { text: '⬅️ Voltar às Cobranças', callback_data: 'menu_cobrancas' },
        { text: '⬅️ Menu Principal', callback_data: 'menu_principal' },
      ]);

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data.startsWith('avenc_det_')) {
      const idx = parseInt(data.replace('avenc_det_', ''), 10);
      const item = (sessionData.cachedAVencer || [])[idx];
      if (item) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [quoteAu, quoteAg] = await Promise.all([
          this.telegramBotService.getQuotationForDate(new Date(), 'AU'),
          this.telegramBotService.getQuotationForDate(new Date(), 'AG'),
        ]);
        const info = this.telegramBotService.resolveReceivableInfo(item, quoteAu.price || 715, quoteAg.price || 6.5);
        const num = item.sale?.orderNumber ? `#${item.sale.orderNumber}` : 'Venda';
        const cli = (item.sale?.pessoa?.name || item.description || 'Cliente').replace(/[*_`]/g, '');
        const dStr = new Date(item.dueDate).toLocaleDateString('pt-BR');
        const isHoje = new Date(item.dueDate).toDateString() === today.toDateString();
        const tel = item.sale?.pessoa?.phone ? `\n• Contato: *${item.sale.pessoa.phone}*` : '';
        const metalTag = info.metalGrams > 0 ? ` (${info.metalGrams.toFixed(info.isSilver ? 2 : 3)} g ${info.metalUnit})` : '';

        const text = `⏰ *DETALHES DO TÍTULO A VENCER*\n\n• Pedido: *${num}*\n• Cliente: *${cli}*${tel}\n• Valor: *R$ ${info.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*${metalTag}\n• Data de Vencimento: *${dStr}* ${isHoje ? '*(Vence HOJE)*' : ''}\n\nDeseja registrar o recebimento deste valor?`;
        const inline_keyboard = [
          [{ text: '💰 Registrar Recebimento / Baixa', callback_data: `bx_avenc_${idx}` }],
          [{ text: '⬅️ Voltar aos a Vencer', callback_data: 'cobranca_avencer' }],
        ];

        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }
    }

    if (data.startsWith('bx_avenc_')) {
      const idx = parseInt(data.replace('bx_avenc_', ''), 10);
      const item = (sessionData.cachedAVencer || [])[idx];
      if (item) {
        sessionData.selectedSaleId = item.saleId || item.id;
        sessionData.selectedOrderNumber = item.sale?.orderNumber;
        await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

        const [quoteAu, quoteAg] = await Promise.all([
          this.telegramBotService.getQuotationForDate(new Date(), 'AU'),
          this.telegramBotService.getQuotationForDate(new Date(), 'AG'),
        ]);
        const info = this.telegramBotService.resolveReceivableInfo(item, quoteAu.price || 715, quoteAg.price || 6.5);
        const num = item.sale?.orderNumber ? `#${item.sale.orderNumber}` : 'Venda';
        const cli = (item.sale?.pessoa?.name || item.description || 'Cliente').replace(/[*_`]/g, '');
        const metalTag = info.metalGrams > 0 ? ` (${info.metalGrams.toFixed(info.isSilver ? 2 : 3)} g ${info.metalUnit})` : '';

        const text = `🏦 *DESTINO DO PAGAMENTO*\n\nPedido: *${num}* (${cli})\nValor: *R$ ${info.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*${metalTag}\n\nEm qual conta o cliente efetuou o depósito?`;
        const inline_keyboard = [
          [
            { text: '🏦 Caixa Itaú', callback_data: 'bx_itau' },
            { text: '💵 Caixa Dinheiro', callback_data: 'bx_dinheiro' },
          ],
          [
            { text: '🧾 Cheques', callback_data: 'bx_cheques' },
            { text: '🏭 Fornecedor BSA', callback_data: 'bx_bsa' },
          ],
          [{ text: '🔍 Outra Conta Corrente', callback_data: 'bx_buscar_conta' }],
          [{ text: '⬅️ Voltar aos a Vencer', callback_data: 'cobranca_avencer' }],
        ];

        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }
    }

    if (data === 'menu_cotacoes') {
      const quotes = await this.receiptLookupUseCase.execute({});
      const au = quotes.latestQuotations?.au;
      const ag = quotes.latestQuotations?.ag;

      let text = '📊 *COTAÇÕES DE METAIS - ERP ELECTROSAL*\n\n';
      if (au) {
        const d = au.date ? new Date(au.date).toLocaleDateString('pt-BR') : 'Hoje';
        const val = Number(au.buyPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const tipo = au.tipoPagamento ? ` (${au.tipoPagamento})` : '';
        text += `🟡 *Ouro (AU):*\n• Cotação: *R$ ${val} / g*${tipo}\n• Data Base: *${d}*\n\n`;
      }
      if (ag) {
        const d = ag.date ? new Date(ag.date).toLocaleDateString('pt-BR') : 'Hoje';
        const val = Number(ag.buyPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const tipo = ag.tipoPagamento ? ` (${ag.tipoPagamento})` : '';
        text += `⚪ *Prata (AG):*\n• Cotação: *R$ ${val} / g*${tipo}\n• Data Base: *${d}*\n\n`;
      }
      text += 'ℹ️ _Valores atualizados em tempo real diretamente do módulo de Cotações do ERP._';

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '⬅️ Voltar ao Menu Principal', callback_data: 'menu_principal' }]],
        },
      });
      return { ok: true };
    }

    if (data === 'menu_rec') {
      const text =
        '💰 *RECEBIMENTO DE CLIENTE*\n\nO valor depositado é referente a:\n\n1️⃣ *Baixar Pedido:* Pedidos pendentes no Contas a Receber (A Combinar / A Prazo).\n2️⃣ *Abater CC do Cliente:* Para clientes que compram à vista na Conta Corrente.';
      const inline_keyboard = [
        [{ text: '📦 Baixar Pedido (A Receber)', callback_data: 'sub_rec_pedidos' }],
        [{ text: '👤 Clientes / Conta Corrente', callback_data: 'sub_rec_clientes' }],
        [{ text: '⬅️ Voltar ao Menu Principal', callback_data: 'menu_principal' }],
      ];
      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data === 'sub_rec_pedidos') {
      const lookup = await this.receiptLookupUseCase.execute({});
      const pending = lookup.pendingReceivables || [];
      sessionData.cachedReceivables = pending;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      let text = '📦 *PEDIDOS EM ABERTO NO ERP*\n\n';
      text += 'Selecione um pedido abaixo ou *digite o número do pedido no chat* (ex: `32042`):\n';
      const inline_keyboard: any[] = [];
      if (pending.length > 0) {
        pending.slice(0, 8).forEach((p: any, idx: number) => {
          const num = p.orderNumber ? `#${p.orderNumber}` : 'Venda';
          const cli = (p.clientName || 'Cliente').slice(0, 14);
          const val = p.amount ? `R$ ${Number(p.amount).toFixed(2)}` : '';
          const metal = p.metalGrams ? ` (${Number(p.metalGrams).toFixed(p.metalUnit === 'Ag' ? 2 : 3)} g ${p.metalUnit})` : '';
          inline_keyboard.push([{ text: `${num} - ${cli}: ${val}${metal}`.trim(), callback_data: `ped_${idx}` }]);
        });
      } else {
        text = 'ℹ️ *Nenhum pedido pendente encontrado no momento.*';
      }

      inline_keyboard.push([
        { text: '🔍 Digitar Nº do Pedido', callback_data: 'buscar_num_pedido' },
      ]);
      inline_keyboard.push([{ text: '⬅️ Voltar', callback_data: 'menu_rec' }]);

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data === 'buscar_num_pedido') {
      sessionData.waitingFor = 'buscar_pedido';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = '🔍 *BUSCA DE PEDIDO POR NÚMERO*\n\n👉 *Digite o número do pedido no chat* (ex: `32042`):';
      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '⬅️ Voltar aos Pedidos', callback_data: 'sub_rec_pedidos' }]],
        },
      });
      return { ok: true };
    }

    if (data.startsWith('sel_ped_sale_')) {
      const saleId = data.replace('sel_ped_sale_', '');
      sessionData.selectedSaleId = saleId;
      sessionData.amount = undefined; // Quitar o total
      sessionData.operationDate = undefined;
      sessionData.customQuotation = undefined;
      sessionData.waitingFor = null;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      return this.telegramBotService.renderPaymentDestination({
        chatId,
        session,
        sessionData,
        messageId,
      });
    }

    if (data === 'voltar_destino_baixa') {
      sessionData.waitingFor = null;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      return this.telegramBotService.renderPaymentDestination({
        chatId,
        session,
        sessionData,
        messageId,
      });
    }

    if (data === 'mudar_data_baixa') {
      sessionData.waitingFor = 'mudar_data_baixa';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const today = new Date();
      const ontem = new Date(today);
      ontem.setDate(ontem.getDate() - 1);
      const anteontem = new Date(today);
      anteontem.setDate(anteontem.getDate() - 2);

      const fDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      const currDateStr = sessionData.operationDate
        ? new Date(sessionData.operationDate).toLocaleDateString('pt-BR')
        : 'Hoje';

      const text = `📅 *ALTERAR DATA DO PAGAMENTO*\n\n` +
        `Data selecionada: *${currDateStr}*\n\n` +
        `Clique em um dos atalhos rápidos abaixo ou digite qualquer data no chat (ex: \`01/10/2026\` ou \`02/10\`):`;

      const inline_keyboard = [
        [
          { text: `📅 Hoje (${fDate(today)})`, callback_data: 'data_baixa_hoje' },
          { text: `📅 Ontem (${fDate(ontem)})`, callback_data: 'data_baixa_ontem' },
        ],
        [
          { text: `📅 Anteontem (${fDate(anteontem)})`, callback_data: 'data_baixa_anteontem' },
        ],
        [{ text: '⬅️ Voltar', callback_data: 'voltar_destino_baixa' }],
      ];

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data === 'data_baixa_hoje' || data === 'data_baixa_ontem' || data === 'data_baixa_anteontem') {
      const d = new Date();
      if (data === 'data_baixa_ontem') d.setDate(d.getDate() - 1);
      if (data === 'data_baixa_anteontem') d.setDate(d.getDate() - 2);
      sessionData.operationDate = d.toISOString();
      sessionData.waitingFor = null;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      return this.telegramBotService.renderPaymentDestination({
        chatId,
        session,
        sessionData,
        messageId,
      });
    }

    if (data === 'mudar_cotacao_baixa') {
      sessionData.waitingFor = 'mudar_cotacao_baixa';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = `📈 *ALTERAR COTAÇÃO DA BAIXA*\n\n` +
        `• Pedido: *#${sessionData.selectedOrderNumber || ''}*\n` +
        `• Cotação atual: *${sessionData.customQuotation ? `R$ ${Number(sessionData.customQuotation).toFixed(2)}/g` : 'Cotação oficial do dia'}*\n\n` +
        `👉 *Digite a cotação desejada no chat agora* (ex: \`685\` ou \`715.50\`):`;

      const inline_keyboard = [
        [{ text: '⬅️ Voltar', callback_data: 'voltar_destino_baixa' }],
      ];

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data === 'mudar_valor_baixa') {
      sessionData.waitingFor = 'valor_baixa_pedido';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = `💵 *ALTERAR VALOR DA BAIXA*\n\n` +
        `• Pedido: *#${sessionData.selectedOrderNumber || ''}*\n` +
        `• Valor atual: *R$ ${Number(sessionData.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n` +
        `👉 *Digite o novo valor a ser baixado em R$* no chat agora (ex: \`28810\` ou \`28810,00\`):`;

      const inline_keyboard = [
        [{ text: '⬅️ Voltar', callback_data: 'voltar_destino_baixa' }],
      ];

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }


    if (data.startsWith('voltar_ped_')) {
      const num = parseInt(data.replace('voltar_ped_', ''), 10);
      if (!isNaN(num)) {
        return this.handleOrderLookupUseCase.execute(chatId, num, session, messageId);
      }
    }

    if (data.startsWith('parcial_ped_')) {
      const saleId = data.replace('parcial_ped_', '');
      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
        include: { pessoa: true, accountsRec: true },
      });
      if (sale) {
        sessionData.selectedSaleId = sale.id;
        sessionData.selectedOrderNumber = sale.orderNumber;
        sessionData.waitingFor = 'valor_baixa_pedido';
        await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

        const pendingAccount = sale.accountsRec.find((ar) => !ar.received);
        const pendente = pendingAccount
          ? Number(pendingAccount.amount) - Number(pendingAccount.amountPaid || 0)
          : Number(sale.netAmount || sale.totalAmount || 0);

        const text = `💵 *BAIXA PARCIAL - PEDIDO #${sale.orderNumber}*\n\n` +
          `• Cliente: *${(sale.pessoa?.name || 'Cliente').replace(/[*_`]/g, '')}*\n` +
          `• Saldo em Aberto: *R$ ${pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n` +
          `👉 *Digite o valor a ser baixado em R$* no chat agora (ex: \`2000\` ou \`5480\`):`;

        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⬅️ Voltar ao Pedido', callback_data: `voltar_ped_${sale.orderNumber}` }],
              [{ text: '❌ Cancelar', callback_data: 'cancelar' }],
            ],
          },
        });
        return { ok: true };
      }
    }

    if (data.startsWith('dividir_ped_')) {
      const saleId = data.replace('dividir_ped_', '');
      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
        include: { pessoa: true, accountsRec: { where: { received: false }, orderBy: { dueDate: 'asc' } } },
      });

      if (!sale || sale.accountsRec.length === 0) {
        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `⚠️ *Este pedido não possui lançamentos a receber em aberto para dividir.*`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⬅️ Voltar ao Pedido', callback_data: `voltar_ped_${sale?.orderNumber || ''}` }],
            ],
          },
        });
        return { ok: true };
      }

      const targetRec = sale.accountsRec[0];
      const valAberto = Number(targetRec.amount) - Number(targetRec.amountPaid || 0);
      const valStr = valAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      sessionData.targetAccountRecId = targetRec.id;
      sessionData.selectedSaleId = sale.id;
      sessionData.selectedOrderNumber = sale.orderNumber;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = `✂️ *DIVIDIR LANÇAMENTO NO ERP*\n\n` +
        `• Pedido: *#${sale.orderNumber}* (${(sale.pessoa?.name || 'Cliente').replace(/[*_`]/g, '')})\n` +
        `• Valor em Aberto: *R$ ${valStr}*\n\n` +
        `Em quantas parcelas você deseja dividir este título no ERP?`;

      const inline_keyboard = [
        [
          { text: '2x (30 e 60 dias)', callback_data: `div_exec_${sale.id}_2` },
          { text: '3x (30, 60 e 90 dias)', callback_data: `div_exec_${sale.id}_3` },
        ],
        [
          { text: '4x (30, 60, 90 e 120 dias)', callback_data: `div_exec_${sale.id}_4` },
        ],
        [{ text: '⬅️ Voltar ao Pedido', callback_data: `voltar_ped_${sale.orderNumber}` }],
      ];

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data.startsWith('div_exec_')) {
      const parts = data.replace('div_exec_', '').split('_');
      const saleId = parts[0];
      const n = parseInt(parts[1], 10) || 2;

      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
        include: { pessoa: true, accountsRec: { where: { received: false }, orderBy: { dueDate: 'asc' } } },
      });

      const targetRec = sale?.accountsRec?.[0];
      if (!sale || !targetRec) {
        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `⚠️ *Não foi possível localizar o título a receber deste pedido.*`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '⬅️ Voltar ao Pedido', callback_data: `voltar_ped_${sale?.orderNumber || ''}` }]],
          },
        });
        return { ok: true };
      }

      const totalVal = new Decimal(targetRec.amount);
      const partVal = totalVal.dividedBy(n).toDecimalPlaces(2);
      let sumParts = new Decimal(0);
      const installments: any[] = [];
      const baseDate = new Date(targetRec.dueDate || new Date());

      for (let i = 1; i <= n; i++) {
        const isLast = i === n;
        const amt = isLast ? totalVal.minus(sumParts) : partVal;
        sumParts = sumParts.plus(amt);

        const d = new Date(baseDate);
        d.setDate(d.getDate() + 30 * (i - 1));
        const dateStr = d.toISOString().split('T')[0];

        installments.push({
          amount: amt.toNumber(),
          dueDate: dateStr,
          description: `${targetRec.description.replace(/\s*-\s*Parcela\s*\d+\/\d+/gi, '')} - Parcela ${i}/${n}`,
        });
      }

      try {
        await this.splitAccountRecUseCase.execute(
          this.telegramBotService.getOrganizationId(),
          targetRec.id,
          { installments },
        );

        let successText = `🎉 *LANÇAMENTO DIVIDIDO COM SUCESSO!*\n\n` +
          `O título de *R$ ${totalVal.toNumber().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* do Pedido *#${sale.orderNumber}* foi dividido em ${n} parcelas no ERP:\n\n`;

        installments.forEach((inst, idx) => {
          const dFmt = new Date(inst.dueDate + 'T12:00:00').toLocaleDateString('pt-BR');
          successText += `• *Parcela ${idx + 1}/${n}:* R$ ${inst.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Venc: ${dFmt})\n`;
        });

        successText += `\n✅ Lançamentos gerados no Contas a Receber!`;

        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: successText,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📦 Ver Pedido Atualizado', callback_data: `voltar_ped_${sale.orderNumber}` }],
              [{ text: '📱 Menu Principal', callback_data: 'menu_principal' }],
            ],
          },
        });
        return { ok: true };
      } catch (err: any) {
        console.error('Erro ao dividir lançamento via Telegram:', err);
        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `❌ *Erro ao dividir lançamento:* ${err.message || 'Erro inesperado'}\n\nVerifique se o lançamento já possui pagamentos parciais no ERP.`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⬅️ Voltar ao Pedido', callback_data: `voltar_ped_${sale.orderNumber}` }],
            ],
          },
        });
        return { ok: true };
      }
    }

    if (data.startsWith('ped_')) {
      const idx = parseInt(data.replace('ped_', ''), 10);
      const pending = sessionData.cachedReceivables || [];
      const selected = pending[idx] || {};
      sessionData.selectedSaleId = selected.saleId || selected.id;
      sessionData.selectedOrderNumber = selected.orderNumber;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const metalInfo = selected.metalGrams ? ` (${Number(selected.metalGrams).toFixed(selected.metalUnit === 'Ag' ? 2 : 3)} g ${selected.metalUnit})` : '';
      const valInfo = selected.amount ? `\nValor: *R$ ${Number(selected.amount).toFixed(2)}*${metalInfo}` : '';
      const text = `🏦 *DESTINO DO PAGAMENTO*\n\nPedido: *#${selected.orderNumber || ''}* (${selected.clientName || 'Cliente'})${valInfo}\n\nEm qual conta o cliente efetuou o depósito?`;
      const inline_keyboard = [
        [
          { text: '🏦 Caixa Itaú', callback_data: 'bx_itau' },
          { text: '💵 Caixa Dinheiro', callback_data: 'bx_dinheiro' },
        ],
        [
          { text: '🧾 Cheques', callback_data: 'bx_cheques' },
          { text: '🏭 Fornecedor BSA', callback_data: 'bx_bsa' },
        ],
        [{ text: '🔍 Outra Conta Corrente', callback_data: 'bx_buscar_conta' }],
        [{ text: '⬅️ Voltar aos Pedidos', callback_data: 'sub_rec_pedidos' }],
      ];

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data.startsWith('bx_link_')) {
      const transacaoId = data.replace('bx_link_', '');
      try {
        const res = await this.settleSaleAutomationUseCase.execute({
          saleId: sessionData.selectedSaleId,
          existingTransacaoId: transacaoId,
          amount: sessionData.amount,
          date: sessionData.operationDate,
          quotation: sessionData.customQuotation,
          observation: sessionData.description,
          fileId: session.fileId,
        });

        await this.telegramBotService.clearTelegramSession(chatId);

        let confirmText = `🎉 *BAIXA VINCULADA COM SUCESSO!*\n\n${res.message}\n\n`;
        if (res.isFullyPaid) {
          confirmText += `✅ *Pedido 100% Quitado no ERP*\n`;
        } else {
          confirmText += `⚠️ *Baixa Parcial Vinculada*\n• Restam: *R$ ${res.remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* a receber\n`;
        }
        confirmText += `📅 Data: *${res.paymentDate.toLocaleDateString('pt-BR')}*\n`;
        confirmText += `📈 Cotação: *R$ ${Number(res.quotation).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/g* (≈ ${Number(res.goldAmount).toFixed(4)} g)\n`;
        confirmText += `🏦 Lançamento vinculado em: *${res.contaCorrenteNome}*\n`;
        if (res.netProfitBRL !== null && res.netProfitBRL !== undefined) {
          const sinal = res.netProfitBRL >= 0 ? '+' : '';
          const sinalAu = res.netDiscrepancyGrams && res.netDiscrepancyGrams >= 0 ? '+' : '';
          confirmText += `📊 *Lucro Apurado:* *${sinal}R$ ${res.netProfitBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* (${sinalAu}${Number(res.netDiscrepancyGrams || 0).toFixed(4)} g Au)\n`;
        }
        confirmText += `🛡️ _Saldo bancário preservado sem duplicidade!_`;

        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: confirmText,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📦 Ver Outros Pedidos', callback_data: 'sub_rec_pedidos' }],
              [{ text: '📱 Menu Principal', callback_data: 'menu_principal' }],
            ],
          },
        });
        return { ok: true };
      } catch (err: any) {
        console.error('Erro ao vincular lançamento em venda:', err);
        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `❌ *Erro ao vincular lançamento:*\n\n_${err.message || 'Erro inesperado'}_\n\nTente novamente.`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Tentar Novamente', callback_data: `sel_ped_sale_${sessionData.selectedSaleId}` }],
              [{ text: '⬅️ Voltar aos Pedidos', callback_data: 'sub_rec_pedidos' }],
            ],
          },
        });
        return { ok: true };
      }
    }

    if (data === 'bx_buscar_conta') {
      sessionData.waitingFor = 'bx_busca_conta';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const backCb = sessionData.selectedSaleId ? `sel_ped_sale_${sessionData.selectedSaleId}` : 'sub_rec_pedidos';
      const text =
        '🔍 *BUSCAR CONTA DE DESTINO*\n\n👉 Digite o nome da conta onde o valor entrou (ex: *techgalvano, cheques, inter, cennabras, bsa, prata...*):';
      await this.telegramBotService.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Voltar ao Pedido', callback_data: backCb }],
          ],
        },
      });
      return { ok: true };
    }

    if (data.startsWith('bx_') && !data.startsWith('bx_venc_') && !data.startsWith('bx_avenc_') && !data.startsWith('bx_link_') && data !== 'bx_buscar_conta') {
      const contasMap: Record<string, string> = {
        itau: '7e94781a-6db9-4da6-bd45-e2ec32e363c3',
        dinheiro: '0f52f287-a3fe-45a9-a357-11296320f232',
        bsa: 'ad06430a-88c2-41c7-9236-6dea0598bd7d',
        cheques: '924c1307-723f-4a23-95db-5b85fa01360c',
        bancos: 'b78bd0d6-758a-4468-992c-e821347f02bc',
        techgalvano: '248aab70-2968-45a6-9c0f-dc46eb76c73d',
      };
      let contaCorrenteId = '';
      if (data.startsWith('bx_id_')) {
        contaCorrenteId = data.replace('bx_id_', '');
      } else {
        const contaKey = data.replace('bx_', '');
        contaCorrenteId = contasMap[contaKey] || contasMap.itau;
      }

      try {
        const res = await this.settleSaleAutomationUseCase.execute({
          saleId: sessionData.selectedSaleId,
          contaCorrenteId,
          amount: sessionData.amount,
          date: sessionData.operationDate,
          quotation: sessionData.customQuotation,
          observation: sessionData.description,
          fileId: session.fileId,
        });

        await this.telegramBotService.clearTelegramSession(chatId);

        let confirmText = `🎉 *BAIXA REGISTRADA COM SUCESSO!*\n\n${res.message}\n\n`;
        if (res.isFullyPaid) {
          confirmText += `✅ *Pedido 100% Quitado no ERP*\n`;
        } else {
          confirmText += `⚠️ *Baixa Parcial Registrada*\n• Restam: *R$ ${res.remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* a receber\n`;
        }
        confirmText += `📅 Data: *${res.paymentDate.toLocaleDateString('pt-BR')}*\n`;
        confirmText += `📈 Cotação: *R$ ${Number(res.quotation).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/g* (≈ ${Number(res.goldAmount).toFixed(4)} g)\n`;
        confirmText += `💰 Saldo lançado em: *${res.contaCorrenteNome}*\n`;
        if (res.netProfitBRL !== null && res.netProfitBRL !== undefined) {
          const sinal = res.netProfitBRL >= 0 ? '+' : '';
          const sinalAu = res.netDiscrepancyGrams && res.netDiscrepancyGrams >= 0 ? '+' : '';
          confirmText += `📊 *Lucro Apurado:* *${sinal}R$ ${res.netProfitBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* (${sinalAu}${Number(res.netDiscrepancyGrams || 0).toFixed(4)} g Au)\n`;
        }
        confirmText += `📎 Comprovante arquivado no AWS S3`;

        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: confirmText,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📦 Ver Outros Pedidos', callback_data: 'sub_rec_pedidos' }],
              [{ text: '📱 Menu Principal', callback_data: 'menu_principal' }],
            ],
          },
        });
        return { ok: true };
      } catch (err: any) {
        console.error('Erro ao dar baixa em venda:', err);
        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `❌ *Erro ao registrar baixa:*\n\n_${err.message || 'Erro inesperado'}_\n\nVerifique se o pedido já foi baixado ou tente novamente.`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Tentar Novamente', callback_data: `sel_ped_sale_${sessionData.selectedSaleId}` }],
              [{ text: '⬅️ Voltar aos Pedidos', callback_data: 'sub_rec_pedidos' }],
            ],
          },
        });
        return { ok: true };
      }
    }

    if (data === 'sub_rec_clientes') {
      const lookup = await this.receiptLookupUseCase.execute({});
      const clients = lookup.clientAccounts || [];
      sessionData.cachedClients = clients;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = '👤 *CLIENTES / CONTAS CORRENTES*\n\nSelecione um cliente para ver o saldo ou digite o nome na busca:';
      const inline_keyboard: any[] = [];
      clients.slice(0, 8).forEach((c) => {
        inline_keyboard.push([{ text: `👤 ${c.name}`, callback_data: `cli_${c.id}` }]);
      });
      inline_keyboard.push([
        { text: '🔍 Buscar Cliente por Nome', callback_data: 'busca_cliente_rec' },
      ]);
      inline_keyboard.push([{ text: '⬅️ Voltar', callback_data: 'menu_rec' }]);

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data === 'busca_cliente_rec') {
      sessionData.waitingFor = 'busca_cliente';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = '🔍 *BUSCA DE CLIENTE*\n\n👉 Digite o nome ou parte do nome do cliente no chat (ex: *artegal, gold, silva...*):';
      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '⬅️ Voltar aos Clientes', callback_data: 'sub_rec_clientes' }]],
        },
      });
      return { ok: true };
    }

    if (data.startsWith('cli_rec_')) {
      const clienteId = data.replace('cli_rec_', '');
      const clientAcc = await this.prisma.contaCorrente.findUnique({
        where: { id: clienteId },
      });
      sessionData.selectedClienteId = clienteId;
      sessionData.selectedClienteName = clientAcc?.nome || 'Cliente';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = `🏦 *DESTINO DO DEPÓSITO DO CLIENTE*\n\nCliente: *${sessionData.selectedClienteName}*\nOnde o cliente efetuou o depósito?`;
      const inline_keyboard = [
        [{ text: '🏦 Minha Conta Itaú', callback_data: 'dep_cli_itau' }],
        [{ text: '🏭 Fornecedor Metal (BSA)', callback_data: 'dep_cli_bsa' }],
        [{ text: '⬅️ Voltar ao Resumo', callback_data: `cli_${clienteId}` }],
      ];

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data.startsWith('cli_peds_')) {
      const clienteId = data.replace('cli_peds_', '');
      const clientAcc = await this.prisma.contaCorrente.findUnique({
        where: { id: clienteId },
      });
      const pessoa = await this.prisma.pessoa.findFirst({
        where: {
          organizationId: this.telegramBotService.getOrganizationId(),
          name: { equals: clientAcc?.nome || '', mode: 'insensitive' },
        },
      });

      const pending = pessoa
        ? await this.prisma.accountRec.findMany({
            where: {
              organizationId: this.telegramBotService.getOrganizationId(),
              received: false,
              sale: { pessoaId: pessoa.id },
            },
            include: { sale: { include: { pessoa: true } } },
            orderBy: { dueDate: 'asc' },
          })
        : [];

      sessionData.cachedReceivables = pending.map((ar) => ({
        id: ar.id,
        description: ar.description,
        amount: Number(ar.amount) - Number(ar.amountPaid || 0),
        dueDate: ar.dueDate,
        saleId: ar.saleId,
        orderNumber: ar.sale?.orderNumber,
        clientName: ar.sale?.pessoa?.name,
      }));
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const nome = clientAcc?.nome ? clientAcc.nome.replace(/[*_`]/g, '') : 'CLIENTE';
      let text = `📦 *PEDIDOS EM ABERTO - ${nome.toUpperCase()}*\n\nSelecione o pedido para dar baixa:`;
      const inline_keyboard: any[] = [];
      if (sessionData.cachedReceivables.length > 0) {
        sessionData.cachedReceivables.forEach((p: any, idx: number) => {
          const num = p.orderNumber ? `#${p.orderNumber}` : 'Venda';
          const val = p.amount ? `R$ ${Number(p.amount).toFixed(2)}` : '';
          inline_keyboard.push([{ text: `${num} - ${val}`.trim(), callback_data: `ped_${idx}` }]);
        });
      } else {
        text = `ℹ️ *Nenhum pedido pendente encontrado para este cliente.*`;
      }
      inline_keyboard.push([{ text: '⬅️ Voltar ao Resumo', callback_data: `cli_${clienteId}` }]);

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data.startsWith('cli_') && !data.startsWith('cli_rec_') && !data.startsWith('cli_peds_')) {
      const clienteId = data.replace('cli_', '');
      sessionData.selectedClienteId = clienteId;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const { text, inline_keyboard } = await this.telegramBotService.buildClientSummary(clienteId);

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data.startsWith('dep_cli_')) {
      const destKey = data.replace('dep_cli_', '');
      const contasMap: Record<string, { id: string; nome: string }> = {
        itau: { id: '7e94781a-6db9-4da6-bd45-e2ec32e363c3', nome: 'Minha Conta Itaú' },
        bsa: { id: 'ad06430a-88c2-41c7-9236-6dea0598bd7d', nome: 'Fornecedor Metal (BSA)' },
      };
      const dest = contasMap[destKey] || contasMap.itau;
      sessionData.destinationAccountId = dest.id;
      sessionData.destinationName = dest.nome;

      if (sessionData.amount && sessionData.amount > 0) {
        const targetDate = sessionData.operationDate ? new Date(sessionData.operationDate) : new Date();
        const quoteData = await this.telegramBotService.getQuotationForDate(targetDate, 'AU');
        sessionData.goldPrice = quoteData.price;
        const historico = sessionData.description || `Depósito Cliente ${sessionData.selectedClienteName || ''}`;
        sessionData.description = historico;
        await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

        const { text: confirmText, inline_keyboard } = await this.telegramBotService.buildDepositConfirmation(sessionData, quoteData);

        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: confirmText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      } else {
        sessionData.waitingFor = 'valor_deposito_cliente';
        await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

        const text = `💰 *VALOR DO DEPÓSITO*\n\n• Cliente: *${sessionData.selectedClienteName || 'Cliente'}*\n• Destino: *${dest.nome}*\n\n👉 *Digite o valor depositado em R$* no chat (ex: *6472* ou *6472 em 28/08*):`;
        await this.telegramBotService.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⬅️ Voltar aos Clientes', callback_data: 'sub_rec_clientes' }],
              [{ text: '❌ Cancelar', callback_data: 'cancelar' }],
            ],
          },
        });
        return { ok: true };
      }
    }

    if (data === 'exec_final_dep') {
      const targetDate = sessionData.operationDate ? new Date(sessionData.operationDate) : new Date();
      const quoteData = await this.telegramBotService.getQuotationForDate(targetDate, 'AU');
      const goldPrice = sessionData.customQuotation || sessionData.goldPrice || quoteData.price;
      const cotacaoBase = sessionData.customQuotation ? 'Personalizada' : quoteData.dateBase;
      const historico = sessionData.description || `Depósito Cliente ${sessionData.selectedClienteName || ''} via Telegram`;

      const res = await this.transferToSupplierUseCase.execute({
        sourceAccountId: sessionData.selectedClienteId,
        destinationAccountId: sessionData.destinationAccountId,
        amount: sessionData.amount,
        quotation: goldPrice,
        date: targetDate.toISOString(),
        description: historico,
        fileId: session.fileId,
      });

      const goldAmount = goldPrice > 0 ? sessionData.amount / goldPrice : 0;
      await this.telegramBotService.clearTelegramSession(chatId);

      const formattedAmount = (sessionData.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const dateLabel = targetDate.toLocaleDateString('pt-BR');
      const confirmText = `🎉 *DEPÓSITO REGISTRADO COM SUCESSO!*\n\n• Cliente: *${sessionData.selectedClienteName || 'Cliente'}*\n• Destino: *${sessionData.destinationName}*\n• Valor: *R$ ${formattedAmount}*\n• Histórico: *${historico}*\n• Data da Operação: *${dateLabel}*\n• Cotação Au (${cotacaoBase}): *R$ ${goldPrice},00 / g*\n• Equiv. Ouro: *${goldAmount.toFixed(3)} g de Au*\n\n✅ Saldo creditado na conta de destino\n✅ Débito registrado na conta do cliente\n📎 Comprovante arquivado no AWS S3`;

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: confirmText,
        parse_mode: 'Markdown',
      });
      return { ok: true };
    }

    if (data === 'mudar_cot_dep') {
      sessionData.waitingFor = 'cotacao_deposito';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const currentPrice = sessionData.customQuotation || sessionData.goldPrice || 715;
      const text = `🟡 *ALTERAR COTAÇÃO DO OURO (AU)*\n\n• Cotação atual: *R$ ${currentPrice},00 / g*\n\n👉 *Digite a nova cotação do ouro em R$* no chat (ex: *720* ou *718,50*):`;
      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Cancelar', callback_data: 'cancelar' }]],
        },
      });
      return { ok: true };
    }

    if (data === 'mudar_hist_dep') {
      sessionData.waitingFor = 'hist_deposito';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = '📝 *DIGITE O HISTÓRICO DO DEPÓSITO*\n\n👉 Digite o texto do histórico no chat (ex: *Adiantamento de pedido*, *Depósito referente à fatura 123*, etc):';
      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Cancelar', callback_data: 'cancelar' }]],
        },
      });
      return { ok: true };
    }

    if (data === 'mudar_data_dep') {
      sessionData.waitingFor = 'data_deposito';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = '📅 *DIGITE A DATA DA OPERAÇÃO*\n\n👉 Digite a data do comprovante no chat (ex: *28/08/2026* ou *28/08*):';
      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Cancelar', callback_data: 'cancelar' }]],
        },
      });
      return { ok: true };
    }

    if (data === 'menu_desp') {
      sessionData.waitingFor = null;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = '💸 *LANÇAR PAGAMENTO / DESPESA*\n\nSelecione a categoria ou faça uma busca:';
      const inline_keyboard = [
        [
          { text: '💡 Luz, Água, Net', callback_data: 'desp_cat_consumo' },
          { text: '🚚 Frete / Logística', callback_data: 'desp_cat_frete' },
        ],
        [
          { text: '🏢 Aluguel / Condomínio', callback_data: 'desp_cat_aluguel' },
          { text: '💼 Salários / Pró-labore', callback_data: 'desp_cat_salario' },
        ],
        [
          { text: '📦 Despesas Gerais', callback_data: 'desp_cat_gerais' },
          { text: '🔍 Buscar Categoria', callback_data: 'desp_buscar_cat' },
        ],
        [{ text: '⬅️ Voltar ao Menu', callback_data: 'menu_principal' }],
      ];

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data === 'desp_buscar_cat') {
      sessionData.waitingFor = 'busca_categoria';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = '🔍 *BUSCAR CATEGORIA NO PLANO DE CONTAS*\n\n👉 Digite no chat parte do nome da despesa (ex: *motoboy, química, software, luciano, combustível, marketing...*):';
      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '⬅️ Voltar às Categorias', callback_data: 'menu_desp' }]],
        },
      });
      return { ok: true };
    }

    if (data.startsWith('desp_cat_')) {
      const cat = data.replace('desp_cat_', '');
      const catNomes: Record<string, string> = {
        consumo: 'Contas de Consumo (Luz, Água, Net)',
        frete: 'Frete / Logística',
        aluguel: 'Aluguel e Condomínio',
        salario: 'Salários / Pró-labore',
        gerais: 'Despesas Gerais',
      };
      sessionData.selectedCategory = cat;
      sessionData.selectedCategoryName = catNomes[cat] || cat;
      sessionData.waitingFor = 'valor_despesa';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = `💳 *CATEGORIA: ${sessionData.selectedCategoryName.toUpperCase()}*\n\n👉 *Digite o valor pago em R$* no chat agora mesmo (ex: 270 ou 270,50):`;
      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Escolher outra categoria', callback_data: 'menu_desp' }],
            [{ text: '❌ Cancelar', callback_data: 'cancelar' }],
          ],
        },
      });
      return { ok: true };
    }

    if (data.startsWith('cat_res_')) {
      const idx = parseInt(data.replace('cat_res_', ''), 10);
      const found = sessionData.cachedSearchCategories || [];
      const chosen = found[idx] || {};
      sessionData.selectedCategory = chosen.id;
      sessionData.selectedCategoryName = chosen.nome;
      sessionData.waitingFor = 'valor_despesa';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = `💳 *CATEGORIA: ${chosen.nome.toUpperCase()}*\n\n👉 *Digite o valor pago em R$* no chat agora mesmo (ex: 270 ou 270,50):`;
      await this.telegramBotService.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Escolher outra categoria', callback_data: 'menu_desp' }],
            [{ text: '❌ Cancelar', callback_data: 'cancelar' }],
          ],
        },
      });
      return { ok: true };
    }

    if (data === 'desp_buscar_conta') {
      sessionData.waitingFor = 'busca_conta';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = '🔍 *BUSCAR CONTA CORRENTE*\n\n👉 Digite o nome da conta que procura (ex: *cennabras, cheques, bsa, prata...*):';
      await this.telegramBotService.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '⬅️ Voltar', callback_data: 'menu_desp' }]],
        },
      });
      return { ok: true };
    }

    if (data.startsWith('cta_res_') || data.startsWith('exec_desp_')) {
      let contaId = '';
      let contaNome = '';
      if (data.startsWith('cta_res_')) {
        const idx = parseInt(data.replace('cta_res_', ''), 10);
        const found = sessionData.cachedSearchAccounts || [];
        const chosen = found[idx] || {};
        contaId = chosen.id;
        contaNome = chosen.nome;
      } else {
        const contaKey = data.replace('exec_desp_', '');
        const contasMap: Record<string, { id: string; nome: string }> = {
          itau: { id: '7e94781a-6db9-4da6-bd45-e2ec32e363c3', nome: 'Caixa Itaú' },
          dinheiro: { id: '0f52f287-a3fe-45a9-a357-11296320f232', nome: 'Caixa Dinheiro' },
        };
        const chosen = contasMap[contaKey] || contasMap.itau;
        contaId = chosen.id;
        contaNome = chosen.nome;
      }

      sessionData.destinationAccountId = contaId;
      sessionData.destinationName = contaNome;

      const targetDate = sessionData.operationDate ? new Date(sessionData.operationDate) : new Date();
      const quoteData = await this.telegramBotService.getQuotationForDate(targetDate, 'AU');
      sessionData.goldPrice = quoteData.price;
      const catLabel = (sessionData.selectedCategoryName || sessionData.selectedCategory || 'GERAIS').toUpperCase();
      const historico = sessionData.description || `Pago referente a ${catLabel}`;
      sessionData.description = historico;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const { text: confirmText, inline_keyboard } = await this.telegramBotService.buildExpenseConfirmation(sessionData, quoteData);

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: confirmText,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    if (data === 'exec_final_desp') {
      const targetDate = sessionData.operationDate ? new Date(sessionData.operationDate) : new Date();
      const quoteData = await this.telegramBotService.getQuotationForDate(targetDate, 'AU');
      const goldPrice = sessionData.customQuotation || sessionData.goldPrice || quoteData.price;
      const historico = sessionData.description || `Pago referente a ${(sessionData.selectedCategoryName || 'DESPESA').toUpperCase()}`;

      const res = await this.createDirectExpenseUseCase.execute({
        amount: sessionData.amount || 0,
        contaCorrenteId: sessionData.destinationAccountId,
        categoria: sessionData.selectedCategory || 'gerais',
        quotation: goldPrice,
        description: historico,
        date: targetDate.toISOString(),
        fileId: session.fileId,
      });

      await this.telegramBotService.clearTelegramSession(chatId);

      const dateLabel = targetDate.toLocaleDateString('pt-BR');
      const confirmText = `🎉 *PAGAMENTO REGISTRADO COM SUCESSO!*\n\n${res.message}\n\n• Histórico: *${historico}*\n• Data da Operação: *${dateLabel}*\n✅ Débito efetuado em ${res.contaCorrenteNome}\n📊 Conta: ${res.categoriaNome}\n🟡 Conversão: ${Number(res.goldAmount).toFixed(3)} g de Au (cotação R$ ${res.goldPrice},00)\n📎 Comprovante salvo no AWS S3`;

      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: confirmText,
        parse_mode: 'Markdown',
      });
      return { ok: true };
    }

    if (data === 'mudar_cot_desp') {
      sessionData.waitingFor = 'cotacao_despesa';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const currentPrice = sessionData.customQuotation || sessionData.goldPrice || 715;
      const text = `🟡 *ALTERAR COTAÇÃO DO OURO (AU)*\n\n• Cotação atual: *R$ ${currentPrice},00 / g*\n\n👉 *Digite a nova cotação do ouro em R$* no chat (ex: *720* ou *718,50*):`;
      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Cancelar', callback_data: 'cancelar' }]],
        },
      });
      return { ok: true };
    }

    if (data === 'mudar_hist_desp') {
      sessionData.waitingFor = 'hist_despesa';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = '📝 *DIGITE O HISTÓRICO DA DESPESA*\n\n👉 Digite o texto do histórico no chat (ex: *Pago para fulano referente a frete de SP*, *Compra de suprimentos*, etc):';
      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Cancelar', callback_data: 'cancelar' }]],
        },
      });
      return { ok: true };
    }

    if (data === 'mudar_data_desp') {
      sessionData.waitingFor = 'data_despesa';
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const text = '📅 *DIGITE A DATA DA OPERAÇÃO*\n\n👉 Digite a data do comprovante/pagamento no chat (ex: *28/08/2026* ou *28/08*):';
      await this.telegramBotService.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Cancelar', callback_data: 'cancelar' }]],
        },
      });
      return { ok: true };
    }

    return { ok: true };
  }
}
