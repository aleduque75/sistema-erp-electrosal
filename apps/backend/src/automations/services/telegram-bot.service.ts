import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MediaService } from '../../media/media.service';

@Injectable()
export class TelegramBotService {
  private readonly botToken = '7924113559:AAGjY9AoO1R7Y-RmqIIJ7wRP4olE53dX3eY';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mediaService: MediaService,
  ) {}

  getOrganizationId(): string {
    return (
      this.configService.get<string>('DEFAULT_ORGANIZATION_ID') ||
      '2a5bb448-056b-4b87-b02f-fec691dd658d'
    );
  }

  async callTelegramApi(method: string, payload: any) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error(`Telegram API error (${method}):`, data);
        // Se falhar por erro de formatação Markdown ("can't parse entities"), reenviar sem parse_mode para garantir entrega
        if (payload.parse_mode && data.description?.includes("can't parse entities")) {
          const fallbackPayload = { ...payload };
          delete fallbackPayload.parse_mode;
          const retryRes = await fetch(`https://api.telegram.org/bot${this.botToken}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fallbackPayload),
          });
          return await retryRes.json();
        }
      }
      return data;
    } catch (e) {
      console.error(`Erro ao chamar Telegram API (${method}):`, e);
      return null;
    }
  }

  async uploadTelegramFileToS3(fileId: string, transacaoId?: string) {
    try {
      const fileRes = await fetch(`https://api.telegram.org/bot${this.botToken}/getFile?file_id=${fileId}`);
      const fileData = await fileRes.json();
      if (!fileData.ok || !fileData.result?.file_path) return null;

      const downloadUrl = `https://api.telegram.org/file/bot${this.botToken}/${fileData.result.file_path}`;
      const dlRes = await fetch(downloadUrl);
      const arrayBuffer = await dlRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const multerFile = {
        buffer,
        originalname: `comprovante-${Date.now()}.jpg`,
        mimetype: 'image/jpeg',
        size: buffer.length,
      } as Express.Multer.File;

      const organizationId = this.getOrganizationId();
      return await this.mediaService.create(
        multerFile,
        organizationId,
        transacaoId ? { transacaoId } : undefined,
      );
    } catch (err) {
      console.error('Erro ao fazer upload do comprovante Telegram para AWS S3:', err);
      return null;
    }
  }

  async getQuotationForDate(date: Date, metal: 'AU' | 'AG' = 'AU'): Promise<{ price: number; dateBase: string }> {
    const organizationId = this.getOrganizationId();
    const quote = await this.prisma.quotation.findFirst({
      where: {
        organizationId,
        metal,
        date: { lte: date },
      },
      orderBy: { date: 'desc' },
    });

    if (quote) {
      const d = quote.date ? new Date(quote.date).toLocaleDateString('pt-BR') : '';
      return { price: Number(quote.buyPrice), dateBase: d };
    }

    const latest = await this.prisma.quotation.findFirst({
      where: { organizationId, metal },
      orderBy: { date: 'desc' },
    });

    return {
      price: latest ? Number(latest.buyPrice) : (metal === 'AG' ? 6.5 : 715),
      dateBase: latest?.date ? new Date(latest.date).toLocaleDateString('pt-BR') : 'Geral',
    };
  }

  parseValueAndDate(text: string): { amount?: number; date?: Date; description?: string } {
    const dateRegex = /(\d{1,2})[\/\.-](\d{1,2})(?:[\/\.-](\d{2,4}))?/;
    const dateMatch = text.match(dateRegex);
    let parsedDate: Date | undefined;

    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1;
      let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : new Date().getFullYear();
      if (year < 100) year += 2000;
      parsedDate = new Date(year, month, day, 12, 0, 0);
    }

    let remaining = text.replace(dateRegex, '').trim();

    // Extrair valor numérico
    const amountRegex = /(\d+(?:[.,]\d{1,2})?)/;
    const amountMatch = remaining.match(amountRegex);
    let amount: number | undefined;

    if (amountMatch) {
      const cleaned = amountMatch[1].replace(',', '.');
      const parsedNum = parseFloat(cleaned);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        amount = parsedNum;
        remaining = remaining.replace(amountMatch[0], '').trim();
        remaining = remaining.replace(/^(?:em|de|para|r\$|ref|referente|referente a)\s+/i, '').trim();
      }
    }

    return {
      amount,
      date: parsedDate,
      description: remaining.length > 2 ? remaining : undefined,
    };
  }

  parseDateOnly(text: string): Date | null {
    const dateRegex = /(\d{1,2})[\/\.-](\d{1,2})(?:[\/\.-](\d{2,4}))?/;
    const match = text.match(dateRegex);
    if (!match) return null;
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    let year = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month, day, 12, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  async checkDuplicateTransaction(params: {
    contaCorrenteId?: string;
    clienteId?: string;
    amount: number;
    date: Date;
  }): Promise<{ isDuplicate: boolean; existingTx?: { descricao: string; dataHora: Date; valor: number; contaNome?: string } }> {
    try {
      const organizationId = this.getOrganizationId();
      const d = new Date(params.date);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const startOfDay = new Date(`${dateStr}T00:00:00.000-03:00`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999-03:00`);

      const accountIds: string[] = [];
      if (params.contaCorrenteId) accountIds.push(params.contaCorrenteId);
      if (params.clienteId) accountIds.push(params.clienteId);

      if (accountIds.length === 0 || !params.amount) return { isDuplicate: false };

      const tx = await this.prisma.transacao.findFirst({
        where: {
          organizationId,
          contaCorrenteId: { in: accountIds },
          valor: {
            gte: params.amount - 0.009,
            lte: params.amount + 0.009,
          },
          dataHora: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          contaCorrente: {
            select: { nome: true },
          },
        },
        orderBy: { dataHora: 'desc' },
      });

      if (tx) {
        return {
          isDuplicate: true,
          existingTx: {
            descricao: tx.descricao || 'Lançamento sem descrição',
            dataHora: tx.dataHora,
            valor: Number(tx.valor),
            contaNome: tx.contaCorrente?.nome || 'Conta',
          },
        };
      }

      return { isDuplicate: false };
    } catch (err) {
      console.error('Erro ao verificar duplicidade de transação:', err);
      return { isDuplicate: false };
    }
  }

  async findMatchingTransactionsForSale(saleId: string, orderNumber: number, amount: number) {
    try {
      const organizationId = this.getOrganizationId();
      const numStr = String(orderNumber);

      // 1. Transações que citam o número do pedido ou vinculadas à venda
      const byDesc = await this.prisma.transacao.findMany({
        where: {
          organizationId,
          tipo: 'CREDITO',
          OR: [
            { descricao: { contains: `#${numStr}` } },
            { descricao: { contains: `Pedido #${numStr}` } },
            { descricao: { contains: `Pedido ${numStr}` } },
            { accountRec: { saleId } },
          ],
        },
        include: { contaCorrente: { select: { id: true, nome: true } } },
        orderBy: { dataHora: 'desc' },
        take: 3,
      });

      // 2. Transações de crédito recentes com o mesmo valor (± 0.05) que ainda não estão vinculadas a nenhum título
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const byAmount = await this.prisma.transacao.findMany({
        where: {
          organizationId,
          tipo: 'CREDITO',
          valor: {
            gte: amount - 0.05,
            lte: amount + 0.05,
          },
          dataHora: { gte: thirtyDaysAgo },
          accountRecId: null,
        },
        include: { contaCorrente: { select: { id: true, nome: true } } },
        orderBy: { dataHora: 'desc' },
        take: 3,
      });

      const map = new Map<string, any>();
      byDesc.forEach((t) => map.set(t.id, { ...t, matchReason: 'ORDER_NUM' }));
      byAmount.forEach((t) => {
        if (!map.has(t.id)) map.set(t.id, { ...t, matchReason: 'EXACT_AMOUNT' });
      });

      return Array.from(map.values());
    } catch (err) {
      console.error('Erro ao buscar transações correspondentes para venda:', err);
      return [];
    }
  }

  async renderPaymentDestination(params: {
    chatId: string;
    session: any;
    sessionData: any;
    messageId?: number;
  }) {
    const { chatId, session, sessionData, messageId } = params;
    const organizationId = this.getOrganizationId();
    const saleId = sessionData.selectedSaleId;
    if (!saleId) return { ok: false };

    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, organizationId },
      include: {
        pessoa: true,
        accountsRec: true,
        metalReceivable: true,
        saleItems: {
          include: {
            product: {
              include: { productGroup: true },
            },
          },
        },
      },
    });

    if (!sale) return { ok: false };

    const paymentDate = sessionData.operationDate ? new Date(sessionData.operationDate) : new Date();
    const dateFormatted = paymentDate.toLocaleDateString('pt-BR');
    const isToday = paymentDate.toDateString() === new Date().toDateString();

    const [quoteAu, quoteAg] = await Promise.all([
      this.getQuotationForDate(paymentDate, 'AU'),
      this.getQuotationForDate(paymentDate, 'AG'),
    ]);
    const defaultAu = quoteAu.price || 715;
    const defaultAg = quoteAg.price || 6.5;

    const pendingAccount = sale.accountsRec.find((ar) => !ar.received);
    let defaultAmount = Number(sale.netAmount || sale.totalAmount || 0);

    let isSilver = false;
    if (pendingAccount) {
      const info = this.resolveReceivableInfo(pendingAccount, defaultAu, defaultAg);
      defaultAmount = info.pendente;
      isSilver = info.isSilver;
    }

    const payAmount = sessionData.amount && sessionData.amount > 0 ? Number(sessionData.amount) : defaultAmount;
    const unit = isSilver ? 'Ag' : 'Au';
    const currentQuotation = sessionData.customQuotation && sessionData.customQuotation > 0
      ? Number(sessionData.customQuotation)
      : (isSilver ? defaultAg : defaultAu);

    const metalGrams = currentQuotation > 0 ? payAmount / currentQuotation : 0;
    const metalStr = `${metalGrams.toFixed(isSilver ? 2 : 4)} g ${unit}`;

    const cli = (sale.pessoa?.name || 'Cliente').replace(/[*_`]/g, '');

    // Verificar se já existe transação similar na conta corrente
    const matchingTxs = await this.findMatchingTransactionsForSale(sale.id, sale.orderNumber, payAmount);

    let text = `🏦 *DESTINO DO PAGAMENTO - PEDIDO #${sale.orderNumber}*\n\n`;
    text += `• *Cliente:* ${cli}\n`;
    text += `• *Valor a Baixar:* *R$ ${payAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n`;
    text += `• *Data do Recebimento:* *${dateFormatted}* ${isToday ? '_(Hoje)_' : ''}\n`;
    text += `• *Cotação ${unit}:* *R$ ${currentQuotation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/g* (≈ *${metalStr}*)\n\n`;

    const inline_keyboard: any[] = [];

    if (matchingTxs.length > 0) {
      text += `⚠️ *Atenção: Identificamos lançamento na conta corrente:*\n`;
      matchingTxs.forEach((m) => {
        const dStr = new Date(m.dataHora).toLocaleDateString('pt-BR');
        const vStr = Number(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const cNome = m.contaCorrente?.nome || 'Conta';
        const dDesc = (m.descricao || '').trim();
        text += `• *${cNome}*: R$ ${vStr} em ${dStr}\n  _${dDesc}_\n`;

        inline_keyboard.push([
          {
            text: `🔗 Vincular ao Lançamento Existente (${cNome})`,
            callback_data: `bx_link_${m.id}`,
          },
        ]);
      });
      text += `\nDeseja vincular ao lançamento existente (sem duplicar saldo) ou registrar novo crédito?\n`;
    } else {
      text += `Selecione a conta onde o recurso entrou:\n`;
    }

    inline_keyboard.push([
      { text: '🏦 Caixa Itaú', callback_data: 'bx_itau' },
      { text: '💵 Caixa Dinheiro', callback_data: 'bx_dinheiro' },
    ]);
    inline_keyboard.push([{ text: '🏭 Fornecedor BSA', callback_data: 'bx_bsa' }]);
    inline_keyboard.push([
      { text: '💵 Alterar Valor', callback_data: 'mudar_valor_baixa' },
      { text: '📅 Alterar Data', callback_data: 'mudar_data_baixa' },
    ]);
    inline_keyboard.push([
      { text: '📈 Alterar Cotação', callback_data: 'mudar_cotacao_baixa' },
      { text: '⬅️ Voltar ao Pedido', callback_data: `voltar_ped_${sale.orderNumber}` },
    ]);

    if (messageId) {
      await this.callTelegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
    } else {
      await this.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
    }
    return { ok: true };
  }


  resolveReceivableInfo(
    item: any,
    auPrice: number,
    agPrice: number,
  ): {
    pendente: number;
    metalGrams: number;
    metalUnit: 'Au' | 'Ag';
    isSilver: boolean;
  } {
    const desc = (
      (item.description || '') +
      ' ' +
      (item.sale?.observation || '')
    ).toLowerCase();
    const metalRecType = item.sale?.metalReceivable?.metalType;

    let isSilver =
      metalRecType === 'AG' ||
      desc.includes('ag') ||
      desc.includes('prata') ||
      desc.includes('silver') ||
      desc.includes('54%');

    if (!isSilver && item.sale?.saleItems && item.sale.saleItems.length > 0) {
      isSilver = item.sale.saleItems.some((si: any) => {
        const prodName = (
          (si.product?.name || '') +
          ' ' +
          (si.product?.productGroup?.name || '')
        ).toLowerCase();
        return (
          prodName.includes('prata') ||
          prodName.includes('silver') ||
          prodName.includes('ag ') ||
          prodName.includes('54%')
        );
      });
    }

    const metalUnit: 'Au' | 'Ag' = isSilver ? 'Ag' : 'Au';
    const price = isSilver ? agPrice || 6.5 : auPrice || 715;

    let pendente = Number(item.amount) - Number(item.amountPaid || 0);
    let metalGrams = item.goldAmount ? Number(item.goldAmount) : 0;

    // Se pendente for 0 (ex: vendas em metal ou parcelamento onde amount no AccountRec é 0)
    if (pendente <= 0) {
      if (item.sale?.netAmount && Number(item.sale.netAmount) > 0) {
        pendente = Number(item.sale.netAmount);
      } else if (metalGrams > 0 && price > 0) {
        pendente = metalGrams * price;
      }
    }

    // Se metalGrams estiver zerado mas temos valor em R$, estimamos as gramas pelo metal correspondente
    if (metalGrams <= 0 && price > 0 && pendente > 0) {
      metalGrams = pendente / price;
    }

    return {
      pendente,
      metalGrams,
      metalUnit,
      isSilver,
    };
  }

  async buildDepositConfirmation(sessionData: any, quoteData: any): Promise<{ text: string; inline_keyboard: any[][] }> {
    const targetDate = sessionData.operationDate ? new Date(sessionData.operationDate) : new Date();
    const dateLabel = targetDate.toLocaleDateString('pt-BR');
    const isToday = targetDate.toDateString() === new Date().toDateString();
    const formattedAmount = (sessionData.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const historico = sessionData.description || `Depósito Cliente ${sessionData.selectedClienteName || ''}`;

    const effectiveGoldPrice = sessionData.customQuotation || quoteData.price;
    const goldAmount = effectiveGoldPrice > 0 ? (sessionData.amount || 0) / effectiveGoldPrice : 0;
    const cotacaoLabel = sessionData.customQuotation ? 'Personalizada' : quoteData.dateBase;

    const dupCheck = await this.checkDuplicateTransaction({
      contaCorrenteId: sessionData.destinationAccountId,
      clienteId: sessionData.selectedClienteId,
      amount: sessionData.amount || 0,
      date: targetDate,
    });

    let text = '';
    let confirmBtnText = `✅ Confirmar (${isToday ? 'Hoje' : dateLabel})`;

    if (dupCheck.isDuplicate) {
      const horaStr = dupCheck.existingTx?.dataHora
        ? new Date(dupCheck.existingTx.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
        : '';
      text += `⚠️ *ALERTA: VALOR JÁ LANÇADO NESTE DIA!*\n` +
        `Já existe um lançamento de *R$ ${formattedAmount}* em *${dateLabel}*:\n` +
        `• _"${dupCheck.existingTx?.descricao}"_ (${dupCheck.existingTx?.contaNome}${horaStr ? ` às ${horaStr}` : ''})\n\n` +
        `❓ *Deseja lançar novamente este valor?*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n`;
      confirmBtnText = `⚠️ Sim, Lançar Mesmo Assim`;
    }

    text += `💰 *CONFIRMAÇÃO DO DEPÓSITO*\n\n` +
      `• Cliente: *${sessionData.selectedClienteName || 'Cliente'}*\n` +
      `• Destino: *${sessionData.destinationName}*\n` +
      `• Valor: *R$ ${formattedAmount}*\n` +
      `• Histórico: *${historico}*\n` +
      `• Data da Operação: *${dateLabel}* ${isToday ? '*(Hoje)*' : ''}\n` +
      `• Cotação Au (${cotacaoLabel}): *R$ ${effectiveGoldPrice},00 / g*\n` +
      `• Equiv. Ouro: *${goldAmount.toFixed(3)} g de Au*\n\n` +
      (dupCheck.isDuplicate ? `Deseja confirmar ou ajustar os dados?` : `Confirma o depósito ou deseja ajustar dados?`);

    const inline_keyboard = [
      [{ text: confirmBtnText, callback_data: 'exec_final_dep' }],
      [
        { text: '🟡 Mudar Cotação', callback_data: 'mudar_cot_dep' },
        { text: '📅 Mudar Data', callback_data: 'mudar_data_dep' },
      ],
      [
        { text: '📝 Mudar Histórico', callback_data: 'mudar_hist_dep' },
        { text: dupCheck.isDuplicate ? '❌ Não Lançar' : '❌ Cancelar', callback_data: 'cancelar' },
      ],
    ];

    return { text, inline_keyboard };
  }

  async buildExpenseConfirmation(sessionData: any, quoteData: any): Promise<{ text: string; inline_keyboard: any[][] }> {
    const targetDate = sessionData.operationDate ? new Date(sessionData.operationDate) : new Date();
    const dateLabel = targetDate.toLocaleDateString('pt-BR');
    const isToday = targetDate.toDateString() === new Date().toDateString();
    const formattedAmount = (sessionData.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const catLabel = (sessionData.selectedCategoryName || sessionData.selectedCategory || 'GERAIS').toUpperCase();
    const historico = sessionData.description || `Pago referente a ${catLabel}`;

    const effectiveGoldPrice = sessionData.customQuotation || quoteData.price;
    const goldAmount = effectiveGoldPrice > 0 ? (sessionData.amount || 0) / effectiveGoldPrice : 0;
    const cotacaoLabel = sessionData.customQuotation ? 'Personalizada' : quoteData.dateBase;

    const dupCheck = await this.checkDuplicateTransaction({
      contaCorrenteId: sessionData.destinationAccountId,
      amount: sessionData.amount || 0,
      date: targetDate,
    });

    let text = '';
    let confirmBtnText = `✅ Confirmar (${isToday ? 'Hoje' : dateLabel})`;

    if (dupCheck.isDuplicate) {
      const horaStr = dupCheck.existingTx?.dataHora
        ? new Date(dupCheck.existingTx.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
        : '';
      text += `⚠️ *ALERTA: VALOR JÁ LANÇADO NESTE DIA!*\n` +
        `Já existe uma despesa de *R$ ${formattedAmount}* em *${dateLabel}*:\n` +
        `• _"${dupCheck.existingTx?.descricao}"_ (${dupCheck.existingTx?.contaNome}${horaStr ? ` às ${horaStr}` : ''})\n\n` +
        `❓ *Deseja lançar novamente este valor?*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n`;
      confirmBtnText = `⚠️ Sim, Lançar Mesmo Assim`;
    }

    text += `💳 *CONFIRMAÇÃO DO PAGAMENTO*\n\n` +
      `• Categoria: *${catLabel}*\n` +
      `• Conta de Saída: *${sessionData.destinationName}*\n` +
      `• Valor: *R$ ${formattedAmount}*\n` +
      `• Histórico: *${historico}*\n` +
      `• Data da Operação: *${dateLabel}* ${isToday ? '*(Hoje)*' : ''}\n` +
      `• Cotação Au (${cotacaoLabel}): *R$ ${effectiveGoldPrice},00 / g*\n` +
      `• Equiv. Ouro: *${goldAmount.toFixed(3)} g de Au*\n\n` +
      (dupCheck.isDuplicate ? `Deseja confirmar ou ajustar os dados?` : `Confirma a despesa ou deseja ajustar dados?`);

    const inline_keyboard = [
      [{ text: confirmBtnText, callback_data: 'exec_final_desp' }],
      [
        { text: '🟡 Mudar Cotação', callback_data: 'mudar_cot_desp' },
        { text: '📅 Mudar Data', callback_data: 'mudar_data_desp' },
      ],
      [
        { text: '📝 Mudar Histórico', callback_data: 'mudar_hist_desp' },
        { text: dupCheck.isDuplicate ? '❌ Não Lançar' : '❌ Cancelar', callback_data: 'cancelar' },
      ],
    ];

    return { text, inline_keyboard };
  }

  async buildClientSummary(clienteId: string): Promise<{ text: string; inline_keyboard: any[][] }> {
    const organizationId = this.getOrganizationId();
    const clientAcc = await this.prisma.contaCorrente.findFirst({
      where: { id: clienteId, organizationId },
    });

    if (!clientAcc) {
      return {
        text: '⚠️ *Cliente não encontrado no sistema.*',
        inline_keyboard: [[{ text: '⬅️ Voltar', callback_data: 'sub_rec_clientes' }]],
      };
    }

    // 1. Calcular saldo atual da conta corrente (BRL e Gold)
    const agregados = await this.prisma.transacao.groupBy({
      by: ['tipo'],
      where: { contaCorrenteId: clienteId },
      _sum: {
        valor: true,
        goldAmount: true,
      },
    });

    const creditosBRL = agregados.find((a) => a.tipo === 'CREDITO')?._sum.valor?.toNumber() || 0;
    const debitosBRL = agregados.find((a) => a.tipo === 'DEBITO')?._sum.valor?.toNumber() || 0;
    const creditosGold = agregados.find((a) => a.tipo === 'CREDITO')?._sum.goldAmount?.toNumber() || 0;
    const debitosGold = agregados.find((a) => a.tipo === 'DEBITO')?._sum.goldAmount?.toNumber() || 0;

    const initialBRL = Number(clientAcc.initialBalanceBRL || 0);
    const initialGold = Number(clientAcc.initialBalanceGold || 0);

    const saldoBRL = initialBRL + creditosBRL - debitosBRL;
    const saldoGold = initialGold + creditosGold - debitosGold;

    // Cotação do dia para referência
    const [quoteAu, quoteAg] = await Promise.all([
      this.getQuotationForDate(new Date(), 'AU'),
      this.getQuotationForDate(new Date(), 'AG'),
    ]);
    const goldPrice = quoteAu.price || 715;
    const silverPrice = quoteAg.price || 6.5;

    // 2. Buscar Pessoa para achar pedidos/duplicatas em aberto
    const pessoa = await this.prisma.pessoa.findFirst({
      where: {
        organizationId,
        name: { equals: clientAcc.nome, mode: 'insensitive' },
      },
    });

    let openReceivables: any[] = [];
    if (pessoa) {
      openReceivables = await this.prisma.accountRec.findMany({
        where: {
          organizationId,
          received: false,
          sale: { pessoaId: pessoa.id },
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
        take: 5,
      });
    }

    // 3. Buscar últimas 2 movimentações
    const ultimasTransacoes = await this.prisma.transacao.findMany({
      where: { contaCorrenteId: clienteId },
      orderBy: { dataHora: 'desc' },
      take: 2,
    });

    const nomeLimpo = clientAcc.nome.replace(/[*_`]/g, '');
    let text = `👤 *RESUMO DO CLIENTE*\n\n`;
    text += `• *Nome:* ${nomeLimpo}\n`;
    if (pessoa?.phone) {
      text += `• *Telefone:* ${pessoa.phone}\n`;
    }
    text += `\n⚖️ *SITUAÇÃO DA CONTA CORRENTE:*\n`;

    if (saldoBRL < -0.01 || saldoGold < -0.001) {
      const devBRL = Math.abs(saldoBRL).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const devGold = Math.abs(saldoGold).toFixed(3);
      text += `🔴 *Saldo Devedor:* R$ ${devBRL} (${devGold} g Metal)\n`;
    } else if (saldoBRL > 0.01 || saldoGold > 0.001) {
      const credBRL = saldoBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const credGold = saldoGold.toFixed(3);
      text += `🟢 *Saldo Credor (Adiantamento):* R$ ${credBRL} (${credGold} g Metal)\n`;
    } else {
      text += `⚪ *Saldo:* R$ 0,00 (Sem pendências em conta)\n`;
    }
    text += `_Cotação Hoje: Au R$ ${goldPrice}/g | Ag R$ ${silverPrice}/g_\n\n`;

    // Títulos / Pedidos em aberto
    if (openReceivables.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      text += `📦 *TÍTULOS / PEDIDOS EM ABERTO (${openReceivables.length}):*\n`;
      let totalAberto = 0;
      openReceivables.forEach((rec) => {
        const info = this.resolveReceivableInfo(rec, goldPrice, silverPrice);
        totalAberto += info.pendente;
        const num = rec.sale?.orderNumber ? `#${rec.sale.orderNumber}` : 'Venda';
        const dStr = new Date(rec.dueDate).toLocaleDateString('pt-BR');
        const isVencido = new Date(rec.dueDate) < today;
        const diffDays = Math.max(1, Math.floor((today.getTime() - new Date(rec.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
        const tag = isVencido ? `⚠️ Vencido há ${diffDays}d` : `Vence em ${dStr}`;
        const metalStr = info.metalGrams > 0 ? ` (${info.metalGrams.toFixed(info.isSilver ? 2 : 3)} g ${info.metalUnit})` : '';
        text += `• ${num}: R$ ${info.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${metalStr} (${tag})\n`;
      });
      text += `*Total em Títulos:* R$ ${totalAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
    } else {
      text += `📦 *Títulos:* Nenhum pedido/duplicata em aberto.\n\n`;
    }

    // Últimas movimentações
    if (ultimasTransacoes.length > 0) {
      text += `🕒 *ÚLTIMA(S) MOVIMENTAÇÃO(ÕES):*\n`;
      ultimasTransacoes.forEach((tx) => {
        const dt = new Date(tx.dataHora).toLocaleDateString('pt-BR');
        const sinal = tx.tipo === 'CREDITO' ? '🟢 Crédito' : '🔴 Débito';
        const v = Number(tx.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const desc = (tx.descricao || '').replace(/[*_`]/g, '');
        text += `• ${dt} - ${sinal} R$ ${v}${desc ? ` (${desc})` : ''}\n`;
      });
      text += '\n';
    }

    text += `━━━━━━━━━━━━━━━━━━━━\nEscolha a operação desejada:`;

    const inline_keyboard: any[][] = [
      [{ text: '💰 Registrar Recebimento / Depósito', callback_data: `cli_rec_${clienteId}` }],
    ];

    if (openReceivables.length > 0) {
      inline_keyboard.push([
        { text: `📦 Baixar Pedidos Deste Cliente (${openReceivables.length})`, callback_data: `cli_peds_${clienteId}` },
      ]);
    }

    inline_keyboard.push([
      { text: '⬅️ Voltar aos Clientes', callback_data: 'sub_rec_clientes' },
      { text: '❌ Cancelar', callback_data: 'cancelar' },
    ]);

    return { text, inline_keyboard };
  }

  async getTelegramSession(chatId: string | number) {
    const cid = String(chatId);
    try {
      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT chat_id, file_id, data FROM erp.telegram_sessions WHERE chat_id = $1 LIMIT 1`,
        cid,
      );
      if (rows && rows.length > 0) {
        return { fileId: rows[0].file_id, data: rows[0].data || {} };
      }
    } catch (e) {
      console.warn('Tabela telegram_sessions ainda não disponível ou erro de leitura:', e);
    }
    return { fileId: null, data: {} };
  }

  async saveTelegramSession(chatId: string | number, fileId?: string | null, data?: any) {
    const cid = String(chatId);
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO erp.telegram_sessions (chat_id, file_id, data, updated_at)
         VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT (chat_id) DO UPDATE 
         SET file_id = EXCLUDED.file_id, data = EXCLUDED.data, updated_at = NOW()`,
        cid,
        fileId || null,
        JSON.stringify(data || {}),
      );
    } catch (e) {
      console.warn('Erro ao salvar sessão telegram:', e);
    }
  }

  async clearTelegramSession(chatId: string | number) {
    const cid = String(chatId);
    try {
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM erp.telegram_sessions WHERE chat_id = $1`,
        cid,
      );
    } catch (e) {
      console.warn('Erro ao limpar sessão telegram:', e);
    }
  }
}
