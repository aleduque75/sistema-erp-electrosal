import { Injectable } from '@nestjs/common';
import { TelegramBotService } from '../services/telegram-bot.service';
import { SearchLookupUseCase } from './search-lookup.use-case';
import { SendDailyDueSummaryUseCase } from './send-daily-due-summary.use-case';
import { HandleOrderLookupUseCase } from './handle-order-lookup.use-case';

@Injectable()
export class HandleTelegramMessageUseCase {
  constructor(
    private readonly telegramBotService: TelegramBotService,
    private readonly searchLookupUseCase: SearchLookupUseCase,
    private readonly sendDailyDueSummaryUseCase: SendDailyDueSummaryUseCase,
    private readonly handleOrderLookupUseCase: HandleOrderLookupUseCase,
  ) {}

  async execute(msg: any) {
    const chatId = msg.chat?.id;
    const text = (msg.text || '').trim();
    const session = await this.telegramBotService.getTelegramSession(chatId);
    const sessionData = session.data || {};

    // A) Usuário enviou foto ou documento (comprovante)
    if (msg.photo || msg.document) {
      let fileId = '';
      if (Array.isArray(msg.photo) && msg.photo.length > 0) {
        fileId = msg.photo[msg.photo.length - 1].file_id;
      } else if (msg.document) {
        fileId = msg.document.file_id;
      }

      await this.telegramBotService.saveTelegramSession(chatId, fileId, sessionData);

      const replyText =
        '🏢 *ELECTROSAL - GESTÃO FINANCEIRA*\n\n📸 *Comprovante recebido e anexado à sessão!*\n\nEscolha a operação para este comprovante:';
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

      await this.telegramBotService.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: replyText,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    // B.0) Usuário digitou o valor para baixa de pedido (parcial ou customizado)
    if (sessionData.waitingFor === 'valor_baixa_pedido') {
      const { amount, date, description } = this.telegramBotService.parseValueAndDate(text);
      if (amount && amount > 0) {
        sessionData.amount = amount;
        if (date) {
          sessionData.operationDate = date.toISOString();
        }
        if (description) {
          sessionData.description = description;
        }
        sessionData.waitingFor = null;
        await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

        const formattedAmount = amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const numStr = sessionData.selectedOrderNumber ? `#${sessionData.selectedOrderNumber}` : '';

        const replyText = `🏦 *DESTINO DO PAGAMENTO (BAIXA)*\n\n` +
          `Pedido: *${numStr}*\n` +
          `Valor a baixar: *R$ ${formattedAmount}*${sessionData.description ? `\nHistórico: *${sessionData.description}*` : ''}\n\n` +
          `Em qual conta o cliente efetuou o depósito?`;

        const inline_keyboard = [
          [
            { text: '🏦 Caixa Itaú', callback_data: 'bx_itau' },
            { text: '💵 Caixa Dinheiro', callback_data: 'bx_dinheiro' },
          ],
          [{ text: '🏭 Fornecedor BSA', callback_data: 'bx_bsa' }],
          [{ text: '⬅️ Voltar ao Pedido', callback_data: `voltar_ped_${sessionData.selectedOrderNumber || ''}` }],
        ];

        await this.telegramBotService.callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: replyText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }
    }

    // B) Usuário digitou o valor de uma despesa
    if (sessionData.waitingFor === 'valor_despesa') {
      const { amount, date, description } = this.telegramBotService.parseValueAndDate(text);
      if (amount) {
        sessionData.amount = amount;
        if (date) {
          sessionData.operationDate = date.toISOString();
        }
        if (description) {
          sessionData.description = description;
        }
        sessionData.waitingFor = null;
        await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

        const formattedAmount = amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const catLabel = (sessionData.selectedCategoryName || sessionData.selectedCategory || 'GERAIS').toUpperCase();

        const replyText = `💳 *CONTA DE SAÍDA DO PAGAMENTO*\n\n• Categoria: *${catLabel}*\n• Valor: *R$ ${formattedAmount}*${sessionData.description ? `\n• Histórico: *${sessionData.description}*` : ''}\n\nDe qual conta saiu o pagamento?`;
        const inline_keyboard = [
          [
            { text: '🏦 Caixa Itaú', callback_data: 'exec_desp_itau' },
            { text: '💵 Caixa Dinheiro', callback_data: 'exec_desp_dinheiro' },
          ],
          [
            { text: '🔍 Outra Conta Corrente', callback_data: 'desp_buscar_conta' },
            { text: '⬅️ Voltar', callback_data: 'menu_desp' },
          ],
        ];

        await this.telegramBotService.callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: replyText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }
    }

    // B.2) Usuário digitou o valor de um depósito de cliente
    if (sessionData.waitingFor === 'valor_deposito_cliente') {
      const { amount, date, description } = this.telegramBotService.parseValueAndDate(text);
      if (amount) {
        sessionData.amount = amount;
        if (date) {
          sessionData.operationDate = date.toISOString();
        }
        if (description) {
          sessionData.description = description;
        }

        const targetDate = sessionData.operationDate ? new Date(sessionData.operationDate) : new Date();
        const quoteData = await this.telegramBotService.getQuotationForDate(targetDate, 'AU');
        sessionData.goldPrice = quoteData.price;
        const historico = sessionData.description || `Depósito Cliente ${sessionData.selectedClienteName || ''}`;
        sessionData.description = historico;
        sessionData.waitingFor = null;
        await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

        const { text: confirmText, inline_keyboard } = await this.telegramBotService.buildDepositConfirmation(sessionData, quoteData);

        await this.telegramBotService.callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: confirmText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }
    }

    // B.3) Usuário digitou data personalizada para depósito
    if (sessionData.waitingFor === 'data_deposito') {
      const parsed = this.telegramBotService.parseDateOnly(text);
      if (parsed) {
        sessionData.operationDate = parsed.toISOString();
        sessionData.waitingFor = null;

        const targetDate = parsed;
        const quoteData = await this.telegramBotService.getQuotationForDate(targetDate, 'AU');
        sessionData.goldPrice = quoteData.price;
        await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

        const { text: confirmText, inline_keyboard } = await this.telegramBotService.buildDepositConfirmation(sessionData, quoteData);

        await this.telegramBotService.callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: confirmText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }
    }

    // B.4) Usuário digitou data personalizada para despesa
    if (sessionData.waitingFor === 'data_despesa') {
      const parsed = this.telegramBotService.parseDateOnly(text);
      if (parsed) {
        sessionData.operationDate = parsed.toISOString();
        sessionData.waitingFor = null;

        const targetDate = parsed;
        const quoteData = await this.telegramBotService.getQuotationForDate(targetDate, 'AU');
        sessionData.goldPrice = quoteData.price;
        await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

        const { text: confirmText, inline_keyboard } = await this.telegramBotService.buildExpenseConfirmation(sessionData, quoteData);

        await this.telegramBotService.callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: confirmText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }
    }

    // B.5) Usuário digitou histórico personalizado para despesa
    if (sessionData.waitingFor === 'hist_despesa') {
      sessionData.description = text.trim();
      sessionData.waitingFor = null;

      const targetDate = sessionData.operationDate ? new Date(sessionData.operationDate) : new Date();
      const quoteData = await this.telegramBotService.getQuotationForDate(targetDate, 'AU');
      sessionData.goldPrice = quoteData.price;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const { text: confirmText, inline_keyboard } = await this.telegramBotService.buildExpenseConfirmation(sessionData, quoteData);

      await this.telegramBotService.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: confirmText,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    // B.6) Usuário digitou histórico personalizado para depósito
    if (sessionData.waitingFor === 'hist_deposito') {
      sessionData.description = text.trim();
      sessionData.waitingFor = null;

      const targetDate = sessionData.operationDate ? new Date(sessionData.operationDate) : new Date();
      const quoteData = await this.telegramBotService.getQuotationForDate(targetDate, 'AU');
      sessionData.goldPrice = quoteData.price;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const { text: confirmText, inline_keyboard } = await this.telegramBotService.buildDepositConfirmation(sessionData, quoteData);

      await this.telegramBotService.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: confirmText,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    // B.7) Usuário digitou cotação personalizada para depósito
    if (sessionData.waitingFor === 'cotacao_deposito') {
      const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num > 0) {
        sessionData.customQuotation = num;
        sessionData.goldPrice = num;
        sessionData.waitingFor = null;

        const targetDate = sessionData.operationDate ? new Date(sessionData.operationDate) : new Date();
        const quoteData = await this.telegramBotService.getQuotationForDate(targetDate, 'AU');
        await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

        const { text: confirmText, inline_keyboard } = await this.telegramBotService.buildDepositConfirmation(sessionData, quoteData);

        await this.telegramBotService.callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: confirmText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }
    }

    // B.8) Usuário digitou cotação personalizada para despesa
    if (sessionData.waitingFor === 'cotacao_despesa') {
      const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num > 0) {
        sessionData.customQuotation = num;
        sessionData.goldPrice = num;
        sessionData.waitingFor = null;

        const targetDate = sessionData.operationDate ? new Date(sessionData.operationDate) : new Date();
        const quoteData = await this.telegramBotService.getQuotationForDate(targetDate, 'AU');
        await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

        const { text: confirmText, inline_keyboard } = await this.telegramBotService.buildExpenseConfirmation(sessionData, quoteData);

        await this.telegramBotService.callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: confirmText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }
    }

    // C) Usuário digitou termo para buscar categoria
    if (sessionData.waitingFor === 'busca_categoria') {
      sessionData.waitingFor = null;
      const search = await this.searchLookupUseCase.execute({ type: 'categoria', q: text });
      const results = search.results || [];
      sessionData.cachedSearchCategories = results;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const inline_keyboard: any[] = [];
      let replyText = '';
      if (results.length > 0) {
        replyText = '🔍 *CATEGORIAS ENCONTRADAS NO PLANO DE CONTAS:*\n\nSelecione a categoria desejada:';
        results.forEach((r: any, idx: number) => {
          inline_keyboard.push([{ text: `${r.codigo ? r.codigo + ' ' : ''}${r.nome}`, callback_data: `cat_res_${idx}` }]);
        });
      } else {
        replyText = `⚠️ Nenhuma categoria encontrada para "*${text}*".`;
      }
      inline_keyboard.push([
        { text: '🔍 Buscar Outro Termo', callback_data: 'desp_buscar_cat' },
        { text: '⬅️ Categorias Padrão', callback_data: 'menu_desp' },
      ]);

      await this.telegramBotService.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: replyText,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    // D) Usuário digitou termo para buscar conta corrente
    if (sessionData.waitingFor === 'busca_conta') {
      sessionData.waitingFor = null;
      const search = await this.searchLookupUseCase.execute({ type: 'conta', q: text });
      const results = search.results || [];
      sessionData.cachedSearchAccounts = results;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const inline_keyboard: any[] = [];
      let replyText = '';
      if (results.length > 0) {
        replyText = '🔍 *CONTAS CORRENTES ENCONTRADAS:*\n\nSelecione de qual conta saiu o pagamento:';
        results.forEach((r: any, idx: number) => {
          inline_keyboard.push([{ text: `🏦 ${r.nome}`, callback_data: `cta_res_${idx}` }]);
        });
      } else {
        replyText = `⚠️ Nenhuma conta encontrada para "*${text}*".`;
      }
      inline_keyboard.push([
        { text: '🔍 Buscar Outra Conta', callback_data: 'desp_buscar_conta' },
        { text: '⬅️ Voltar', callback_data: 'menu_desp' },
      ]);

      await this.telegramBotService.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: replyText,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    // D.2) Usuário digitou termo para buscar cliente
    if (sessionData.waitingFor === 'busca_cliente') {
      sessionData.waitingFor = null;
      const search = await this.searchLookupUseCase.execute({ type: 'cliente', q: text });
      const results = search.results || [];
      sessionData.cachedSearchClients = results;
      await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);

      const inline_keyboard: any[] = [];
      let replyText = '';
      if (results.length > 0) {
        replyText = '🔍 *CLIENTES ENCONTRADOS:*\n\nSelecione um cliente para abrir o resumo financeiro:';
        results.forEach((c: any) => {
          inline_keyboard.push([{ text: `👤 ${c.nome}`, callback_data: `cli_${c.id}` }]);
        });
      } else {
        replyText = `⚠️ Nenhum cliente encontrado para "*${text}*".`;
      }
      inline_keyboard.push([
        { text: '🔍 Buscar Outro Nome', callback_data: 'busca_cliente_rec' },
        { text: '⬅️ Ver Todos os Clientes', callback_data: 'sub_rec_clientes' },
      ]);

      await this.telegramBotService.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: replyText,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    // E.0) Usuário digitou número de pedido (ex: 32042, #32042, pedido 32042)
    const orderNumMatch = text.match(/(?:pedido|ped|#)?\s*(\d{4,7})\b/i);
    const isPureNumber = /^\s*#?\d{4,7}\s*$/.test(text);

    if (
      sessionData.waitingFor === 'buscar_pedido' ||
      isPureNumber ||
      (orderNumMatch && (text.toLowerCase().includes('pedido') || text.toLowerCase().includes('ped') || text.startsWith('#')))
    ) {
      const numStr = orderNumMatch ? orderNumMatch[1] : text.replace(/\D/g, '');
      const orderNum = parseInt(numStr, 10);
      if (!isNaN(orderNum) && orderNum > 0) {
        sessionData.waitingFor = null;
        await this.telegramBotService.saveTelegramSession(chatId, session.fileId, sessionData);
        return this.handleOrderLookupUseCase.execute(chatId, orderNum, session);
      }
    }

    // E.1) Atalho por comando de texto para cobranças/vencidos
    const cleanCmd = text.toLowerCase().trim();
    if (
      cleanCmd === '/cobrancas' ||
      cleanCmd === 'cobrancas' ||
      cleanCmd === 'cobrança' ||
      cleanCmd === 'cobranca' ||
      cleanCmd === '/vencidos' ||
      cleanCmd === 'vencidos'
    ) {
      await this.sendDailyDueSummaryUseCase.execute(chatId);
      return { ok: true };
    }

    // E.2) Mensagem geral (ex: menu, ola, /start)
    let replyText = '🏢 *ELECTROSAL - GESTÃO FINANCEIRA*\n\n';
    if (session.fileId) {
      replyText += '📸 *Comprovante em anexo na sessão!*\n\n';
    }
    replyText += 'Olá! Escolha a operação que deseja realizar:';

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

    await this.telegramBotService.callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: replyText,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard },
    });
    return { ok: true };
  }
}
