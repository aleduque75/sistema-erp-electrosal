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
      return await res.json();
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
