import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExpenseAutomationDto } from './dto/create-expense-automation.dto';
import { CreateAccountPayUseCase } from '../accounts-pay/use-cases/create-account-pay.use-case';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ConfirmSaleUseCase } from '../sales/use-cases/confirm-sale.use-case';
import { CreateTransferUseCase } from '../transacoes/use-cases/create-transfer.use-case';
import { MediaService } from '../media/media.service';
import Decimal from 'decimal.js';

@Injectable()
export class AutomationsService {
  constructor(
    private readonly createAccountPayUseCase: CreateAccountPayUseCase,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly confirmSaleUseCase: ConfirmSaleUseCase,
    private readonly createTransferUseCase: CreateTransferUseCase,
    private readonly mediaService: MediaService,
  ) {}

  private getOrganizationId(): string {
    return (
      this.configService.get<string>('DEFAULT_ORGANIZATION_ID') ||
      '2a5bb448-056b-4b87-b02f-fec691dd658d'
    );
  }

  async createExpense(createExpenseDto: CreateExpenseAutomationDto) {
    const { description, amount, dueDate, creditorName } = createExpenseDto;
    const organizationId = this.getOrganizationId();

    let fornecedorPessoa = await this.prisma.pessoa.findFirst({
      where: { name: creditorName, organizationId },
    });

    if (!fornecedorPessoa) {
      fornecedorPessoa = await this.prisma.pessoa.create({
        data: {
          organizationId,
          name: creditorName,
          type: 'JURIDICA',
        },
      });
    }

    let fornecedor = await this.prisma.fornecedor.findUnique({
      where: { pessoaId: fornecedorPessoa.id },
    });

    if (!fornecedor) {
      fornecedor = await this.prisma.fornecedor.create({
        data: {
          pessoaId: fornecedorPessoa.id,
          organizationId,
        },
      });
    }

    const createAccountPayDto = {
      dueDate: new Date(dueDate),
      description,
      amount,
      fornecedorId: fornecedor.pessoaId,
    };

    return this.createAccountPayUseCase.execute(organizationId, createAccountPayDto);
  }

  async receiptLookup(query: { payer?: string; amount?: number; orderNumber?: number }) {
    const organizationId = this.getOrganizationId();
    const { payer, amount, orderNumber } = query;

    let saleMatches: any[] = [];

    // 1. If explicit orderNumber is given
    if (orderNumber) {
      const sale = await this.prisma.sale.findFirst({
        where: { orderNumber, organizationId },
        include: { pessoa: true },
      });
      if (sale) {
        saleMatches.push(sale);
      }
    }

    // 2. Search pending / open sales matching payer or amount
    if (saleMatches.length === 0) {
      const orConditions: any[] = [];

      if (payer && payer.trim().length >= 3) {
        orConditions.push({
          pessoa: {
            name: { contains: payer.trim(), mode: 'insensitive' },
          },
        });
      }

      if (amount && amount > 0) {
        const minAmount = new Decimal(amount).times(0.97);
        const maxAmount = new Decimal(amount).times(1.03);
        orConditions.push({
          netAmount: { gte: minAmount, lte: maxAmount },
        });
      }

      const whereClause: any = {
        organizationId,
        status: { in: ['PENDENTE', 'A_SEPARAR', 'SEPARADO'] },
      };

      if (orConditions.length > 0) {
        whereClause.OR = orConditions;
      }

      saleMatches = await this.prisma.sale.findMany({
        where: whereClause,
        include: { pessoa: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    }

    // 3. Search pending AccountRec
    const orRecConditions: any[] = [];
    if (payer && payer.trim().length >= 3) {
      orRecConditions.push({
        description: { contains: payer.trim(), mode: 'insensitive' },
      });
    }
    if (amount && amount > 0) {
      orRecConditions.push({
        amount: {
          gte: new Decimal(amount).times(0.97),
          lte: new Decimal(amount).times(1.03),
        },
      });
    }

    const pendingAccountRecs = await this.prisma.accountRec.findMany({
      where: {
        organizationId,
        received: false,
        ...(orRecConditions.length > 0 ? { OR: orRecConditions } : {}),
      },
      include: { sale: { include: { pessoa: true } } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    // 4. Fetch Bank Accounts (to receive money into)
    const bankAccounts = await this.prisma.contaCorrente.findMany({
      where: {
        organizationId,
        isActive: true,
        type: 'BANCO',
      },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, numeroConta: true, agencia: true },
    });

    // 5. Fetch Supplier Accounts (to transfer money to)
    const supplierAccounts = await this.prisma.contaCorrente.findMany({
      where: {
        organizationId,
        isActive: true,
        type: 'FORNECEDOR_METAL',
      },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    });

    // 6. Fetch Client Accounts
    const clientAccounts = await this.prisma.contaCorrente.findMany({
      where: {
        organizationId,
        isActive: true,
        type: 'CLIENTE',
      },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    });

    // 7. Fetch Latest Quotations
    const [latestAu, latestAg] = await Promise.all([
      this.prisma.quotation.findFirst({
        where: { organizationId, metal: 'AU' },
        orderBy: { date: 'desc' },
      }),
      this.prisma.quotation.findFirst({
        where: { organizationId, metal: 'AG' },
        orderBy: { date: 'desc' },
      }),
    ]);

    return {
      sales: saleMatches.map((s) => ({
        id: s.id,
        orderNumber: s.orderNumber,
        clientName: s.pessoa?.name || 'Cliente',
        netAmount: Number(s.netAmount || s.totalAmount || 0),
        status: s.status,
        paymentMethod: s.paymentMethod,
        date: s.createdAt,
      })),
      pendingReceivables: pendingAccountRecs.map((ar) => ({
        id: ar.id,
        description: ar.description,
        amount: Number(ar.amount),
        dueDate: ar.dueDate,
        saleId: ar.saleId,
        orderNumber: ar.sale?.orderNumber,
        clientName: ar.sale?.pessoa?.name,
      })),
      bankAccounts: bankAccounts.map((b) => ({
        id: b.id,
        name: b.nome,
        account: b.numeroConta,
        agency: b.agencia,
      })),
      supplierAccounts: supplierAccounts.map((s) => ({
        id: s.id,
        name: s.nome,
      })),
      clientAccounts: clientAccounts.map((c) => ({
        id: c.id,
        name: c.nome,
      })),
      latestQuotations: {
        au: latestAu
          ? {
              buyPrice: Number(latestAu.buyPrice),
              sellPrice: Number(latestAu.sellPrice),
              date: latestAu.date,
              tipoPagamento: latestAu.tipoPagamento || 'Pix',
            }
          : null,
        ag: latestAg
          ? {
              buyPrice: Number(latestAg.buyPrice),
              sellPrice: Number(latestAg.sellPrice),
              date: latestAg.date,
              tipoPagamento: latestAg.tipoPagamento || 'Pix',
            }
          : null,
      },
    };
  }

  async settleSale(dto: {
    saleId: string;
    contaCorrenteId: string;
    amount?: number;
    date?: string;
    observation?: string;
    fileBase64?: string;
    mimeType?: string;
  }) {
    const organizationId = this.getOrganizationId();
    const { saleId, contaCorrenteId } = dto;

    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, organizationId },
      include: { pessoa: true },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
    }

    const contaCorrente = await this.prisma.contaCorrente.findFirst({
      where: { id: contaCorrenteId, organizationId },
    });

    if (!contaCorrente) {
      throw new NotFoundException(`Conta Corrente com ID ${contaCorrenteId} não encontrada.`);
    }

    // Execute confirmation with A_VISTA pointing to selected contaCorrente
    await this.confirmSaleUseCase.execute(
      organizationId,
      'automation-system',
      saleId,
      {
        paymentMethod: 'A_VISTA',
        contaCorrenteId: contaCorrente.id,
        keepSaleStatusPending: false,
      },
    );

    // If receipt photo is sent, upload to AWS S3
    if (dto.fileBase64) {
      try {
        const buffer = Buffer.from(dto.fileBase64, 'base64');
        const multerFile = {
          buffer,
          originalname: `comprovante-venda-${sale.orderNumber}-${Date.now()}.jpg`,
          mimetype: dto.mimeType || 'image/jpeg',
          size: buffer.length,
        } as Express.Multer.File;

        await this.mediaService.create(multerFile, organizationId);
      } catch (err) {
        console.error('Erro ao fazer upload do comprovante para AWS S3:', err);
      }
    }

    return {
      success: true,
      message: `Venda #${sale.orderNumber} (${sale.pessoa?.name}) baixada com sucesso e creditada em ${contaCorrente.nome}!`,
      orderNumber: sale.orderNumber,
      clientName: sale.pessoa?.name,
      contaCorrenteNome: contaCorrente.nome,
    };
  }

  async transferToSupplier(dto: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    quotation?: number;
    description?: string;
    date?: string;
    contaContabilId?: string;
    fileBase64?: string;
    mimeType?: string;
  }) {
    const organizationId = this.getOrganizationId();
    const { sourceAccountId, destinationAccountId, amount, description, date } = dto;

    let contaContabilId = dto.contaContabilId;
    if (!contaContabilId) {
      const sourceAcc = await this.prisma.contaCorrente.findUnique({
        where: { id: sourceAccountId },
      });
      if (sourceAcc?.contaContabilId) {
        contaContabilId = sourceAcc.contaContabilId;
      } else {
        const firstContabil = await this.prisma.contaContabil.findFirst({
          where: { organizationId },
        });
        contaContabilId = firstContabil?.id;
      }
    }

    if (!contaContabilId) {
      throw new NotFoundException('Conta Contábil não encontrada para realizar a transferência.');
    }

    let goldPrice = dto.quotation;
    if (!goldPrice || goldPrice <= 0) {
      const quotation = await this.prisma.quotation.findFirst({
        where: { organizationId, metal: 'AU' },
        orderBy: { date: 'desc' },
      });
      goldPrice = quotation ? Number(quotation.buyPrice) : 715;
    }

    const result = await this.createTransferUseCase.execute(organizationId, {
      sourceAccountId,
      destinationAccountId,
      amount: Number(amount),
      quotation: goldPrice,
      description: description || 'Transferência via Automação Telegram',
      dataHora: date ? new Date(date) : new Date(),
      contaContabilId,
    });

    // If receipt photo is sent, upload to AWS S3 and attach to the debit transaction
    if (dto.fileBase64) {
      try {
        const buffer = Buffer.from(dto.fileBase64, 'base64');
        const multerFile = {
          buffer,
          originalname: `comprovante-transferencia-${Date.now()}.jpg`,
          mimetype: dto.mimeType || 'image/jpeg',
          size: buffer.length,
        } as Express.Multer.File;

        await this.mediaService.create(multerFile, organizationId, {
          transacaoId: result.debitTransaction.id,
        });
      } catch (err) {
        console.error('Erro ao fazer upload do comprovante para AWS S3:', err);
      }
    }

    return {
      success: true,
      message: `Transferência de R$ ${Number(amount).toFixed(2)} realizada com sucesso!`,
      debitTransactionId: result.debitTransaction.id,
      creditTransactionId: result.creditTransaction.id,
    };
  }

  async createDirectExpense(dto: {
    amount: number;
    contaCorrenteId: string;
    categoria: string;
    quotation?: number;
    description?: string;
    date?: string;
    fileBase64?: string;
    mimeType?: string;
  }) {
    const organizationId = this.getOrganizationId();
    const { amount, contaCorrenteId, categoria, description, date } = dto;

    const contasMap: Record<string, string> = {
      frete: 'fecc1af8-54ca-4e2b-a904-ab151fbcb6a6',
      consumo: '51f1ee92-82e3-484b-9371-d2196d50d8c4',
      aluguel: 'edef269f-9c41-4f5f-94a1-31b771aac51a',
      salario: '9a28d458-a651-4874-858a-06fd3614ce80',
      gerais: '65824286-aa95-4406-b5cb-6755fde5c8ab',
    };

    let contaContabilId = contasMap[categoria.toLowerCase()];
    if (!contaContabilId) {
      if (categoria && categoria.length === 36 && categoria.includes('-')) {
        contaContabilId = categoria;
      } else {
        contaContabilId = contasMap.gerais;
      }
    }

    let goldPrice = dto.quotation;
    if (!goldPrice || goldPrice <= 0) {
      const quotation = await this.prisma.quotation.findFirst({
        where: { organizationId, metal: 'AU' },
        orderBy: { date: 'desc' },
      });
      goldPrice = quotation ? Number(quotation.buyPrice) : 715;
    }
    const goldAmount = goldPrice > 0 ? Number(amount) / goldPrice : 0;

    const contaCorrente = await this.prisma.contaCorrente.findUnique({
      where: { id: contaCorrenteId },
    });
    if (!contaCorrente) {
      throw new NotFoundException('Conta corrente não encontrada');
    }

    const contaContabil = await this.prisma.contaContabil.findUnique({
      where: { id: contaContabilId },
    });

    const descFinal = description || `Despesa ${contaContabil?.nome || categoria.toUpperCase()} via Telegram`;

    // Create DEBITO transaction
    const transaction = await this.prisma.transacao.create({
      data: {
        organizationId,
        tipo: 'DEBITO',
        valor: Number(amount),
        goldAmount,
        goldPrice,
        moeda: 'BRL',
        descricao: descFinal,
        dataHora: date ? new Date(date) : new Date(),
        contaContabilId,
        contaCorrenteId,
      },
    });

    // Upload attachment if present
    if (dto.fileBase64) {
      try {
        const buffer = Buffer.from(dto.fileBase64, 'base64');
        const multerFile = {
          buffer,
          originalname: `comprovante-despesa-${Date.now()}.jpg`,
          mimetype: dto.mimeType || 'image/jpeg',
          size: buffer.length,
        } as Express.Multer.File;

        await this.mediaService.create(multerFile, organizationId, {
          transacaoId: transaction.id,
        });
      } catch (err) {
        console.error('Erro ao fazer upload do comprovante para AWS S3:', err);
      }
    }

    return {
      success: true,
      message: `Despesa de R$ ${Number(amount).toFixed(2)} (${goldAmount.toFixed(3)}g Au) lançada com sucesso em ${contaCorrente.nome}!`,
      amount: Number(amount),
      goldAmount,
      goldPrice,
      contaCorrenteNome: contaCorrente.nome,
      categoriaNome: contaContabil?.nome || categoria,
      transactionId: transaction.id,
    };
  }

  async searchLookup(query: { q?: string; type?: 'categoria' | 'conta' }) {
    const organizationId = this.getOrganizationId();
    const { q, type } = query;
    const searchTerm = (q || '').trim();

    if (type === 'categoria') {
      const results = await this.prisma.contaContabil.findMany({
        where: {
          organizationId,
          tipo: 'DESPESA',
          aceitaLancamento: true,
          ...(searchTerm ? { nome: { contains: searchTerm, mode: 'insensitive' } } : {}),
        },
        take: 6,
        orderBy: { codigo: 'asc' },
      });
      return { results };
    }

    if (type === 'conta') {
      const results = await this.prisma.contaCorrente.findMany({
        where: {
          organizationId,
          isActive: true,
          type: { in: ['BANCO', 'FORNECEDOR_METAL'] },
          ...(searchTerm ? { nome: { contains: searchTerm, mode: 'insensitive' } } : {}),
        },
        take: 6,
        orderBy: { nome: 'asc' },
      });
      return { results };
    }

    return { results: [] };
  }

  private async callTelegramApi(method: string, payload: any) {
    const token = '7924113559:AAGjY9AoO1R7Y-RmqIIJ7wRP4olE53dX3eY';
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
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

  private async uploadTelegramFileToS3(fileId: string, transacaoId?: string) {
    try {
      const token = '7924113559:AAGjY9AoO1R7Y-RmqIIJ7wRP4olE53dX3eY';
      const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
      const fileData = await fileRes.json();
      if (!fileData.ok || !fileData.result?.file_path) return null;

      const downloadUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
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
      price: latest ? Number(latest.buyPrice) : 715,
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

  async getTelegramSession(chatId: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT chat_id, file_id, data FROM erp.telegram_sessions WHERE chat_id = $1`,
      String(chatId),
    );
    if (rows && rows.length > 0) {
      return { fileId: rows[0].file_id, data: rows[0].data || {} };
    }
    return { fileId: null, data: {} };
  }

  async saveTelegramSession(chatId: string, fileId?: string | null, data?: any) {
    await this.prisma.$queryRawUnsafe(
      `INSERT INTO erp.telegram_sessions (chat_id, file_id, data, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (chat_id) DO UPDATE
       SET file_id = COALESCE(EXCLUDED.file_id, erp.telegram_sessions.file_id),
           data = erp.telegram_sessions.data || EXCLUDED.data,
           updated_at = NOW()`,
      String(chatId),
      fileId !== undefined ? fileId : null,
      JSON.stringify(data || {}),
    );
  }

  async clearTelegramSession(chatId: string) {
    await this.prisma.$queryRawUnsafe(
      `DELETE FROM erp.telegram_sessions WHERE chat_id = $1`,
      String(chatId),
    );
  }

  async handleTelegramUpdate(update: any) {
    if (!update) return { ok: true };

    // 1. TRATAMENTO DE CALLBACK QUERY (CLIQUES NOS BOTÕES)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id || cb.from?.id;
      const messageId = cb.message?.message_id;
      const data = cb.data || '';

      const session = await this.getTelegramSession(chatId);
      const sessionData = session.data || {};

      if (data === 'cancelar') {
        await this.clearTelegramSession(chatId);
        await this.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: '❌ *Operação cancelada.* Digite `menu` ou envie um comprovante quando quiser recomeçar.',
          parse_mode: 'Markdown',
        });
        return { ok: true };
      }

      if (data === 'menu_principal') {
        sessionData.waitingFor = null;
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

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
            { text: '📊 Cotações de Hoje', callback_data: 'menu_cotacoes' },
            { text: '❌ Cancelar', callback_data: 'cancelar' },
          ],
        ];

        await this.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }

      if (data === 'menu_cotacoes') {
        const quotes = await this.receiptLookup({});
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

        await this.callTelegramApi('editMessageText', {
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
          [{ text: '👤 Abater da CC do Cliente', callback_data: 'sub_rec_clientes' }],
          [{ text: '⬅️ Voltar ao Menu Principal', callback_data: 'menu_principal' }],
        ];
        await this.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }

      if (data === 'sub_rec_pedidos') {
        const lookup = await this.receiptLookup({});
        const pending = lookup.pendingReceivables || [];
        sessionData.cachedReceivables = pending;
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        let text = '📦 *PEDIDOS EM ABERTO NO ERP*\n\nSelecione o pedido para dar baixa:';
        const inline_keyboard: any[] = [];
        if (pending.length > 0) {
          pending.slice(0, 5).forEach((p: any, idx: number) => {
            const num = p.orderNumber ? `#${p.orderNumber}` : 'Venda';
            const cli = p.clientName || 'Cliente';
            const val = p.amount ? `R$ ${Number(p.amount).toFixed(2)}` : '';
            inline_keyboard.push([{ text: `${num} - ${cli.substring(0, 15)} ${val}`.trim(), callback_data: `ped_${idx}` }]);
          });
        } else {
          text = 'ℹ️ *Nenhum pedido pendente encontrado no momento.*';
        }
        inline_keyboard.push([{ text: '⬅️ Voltar', callback_data: 'menu_rec' }]);

        await this.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }

      if (data.startsWith('ped_')) {
        const idx = parseInt(data.replace('ped_', ''), 10);
        const pending = sessionData.cachedReceivables || [];
        const selected = pending[idx] || {};
        sessionData.selectedSaleId = selected.saleId || selected.id;
        sessionData.selectedOrderNumber = selected.orderNumber;
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const text = `🏦 *DESTINO DO PAGAMENTO*\n\nPedido: *#${selected.orderNumber || ''}*\n\nEm qual conta o cliente efetuou o depósito?`;
        const inline_keyboard = [
          [
            { text: '🏦 Caixa Itaú', callback_data: 'bx_itau' },
            { text: '💵 Caixa Dinheiro', callback_data: 'bx_dinheiro' },
          ],
          [{ text: '🏭 Fornecedor BSA', callback_data: 'bx_bsa' }],
          [{ text: '⬅️ Voltar aos Pedidos', callback_data: 'sub_rec_pedidos' }],
        ];

        await this.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }

      if (data.startsWith('bx_')) {
        const contaKey = data.replace('bx_', '');
        const contasMap: Record<string, string> = {
          itau: '7e94781a-6db9-4da6-bd45-e2ec32e363c3',
          dinheiro: '0f52f287-a3fe-45a9-a357-11296320f232',
          bsa: 'ad06430a-88c2-41c7-9236-6dea0598bd7d',
        };
        const contaCorrenteId = contasMap[contaKey] || contasMap.itau;
        const res = await this.settleSale({
          saleId: sessionData.selectedSaleId,
          contaCorrenteId,
        });

        if (session.fileId) {
          await this.uploadTelegramFileToS3(session.fileId);
        }

        await this.clearTelegramSession(chatId);
        await this.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `🎉 *BAIXA CONFIRMADA COM SUCESSO!*\n\n${res.message}\n\n✅ Status da Venda atualizado no ERP\n💰 Saldo lançado na Conta Corrente\n📎 Comprovante arquivado no AWS S3`,
          parse_mode: 'Markdown',
        });
        return { ok: true };
      }

      if (data === 'sub_rec_clientes') {
        const lookup = await this.receiptLookup({});
        const clients = lookup.clientAccounts || [];
        sessionData.cachedClientAccounts = clients;
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        let text = '👤 *CLIENTES COM CONTA CORRENTE ATIVA*\n\nSelecione o cliente que efetuou o depósito:';
        const inline_keyboard: any[] = [];
        clients.forEach((c: any) => {
          inline_keyboard.push([{ text: `👤 ${c.name}`, callback_data: `cli_${c.id}` }]);
        });
        inline_keyboard.push([{ text: '⬅️ Voltar', callback_data: 'menu_rec' }]);

        await this.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }

      if (data.startsWith('cli_')) {
        const clienteId = data.replace('cli_', '');
        const clientAcc = await this.prisma.contaCorrente.findUnique({
          where: { id: clienteId },
        });
        sessionData.selectedClienteId = clienteId;
        sessionData.selectedClienteName = clientAcc?.nome || 'Cliente';
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const text = `🏦 *DESTINO DO DEPÓSITO DO CLIENTE*\n\nCliente: *${sessionData.selectedClienteName}*\nOnde o cliente efetuou o depósito?`;
        const inline_keyboard = [
          [{ text: '🏦 Minha Conta Itaú', callback_data: 'dep_cli_itau' }],
          [{ text: '🏭 Fornecedor Metal (BSA)', callback_data: 'dep_cli_bsa' }],
          [{ text: '⬅️ Voltar aos Clientes', callback_data: 'sub_rec_clientes' }],
        ];

        await this.callTelegramApi('editMessageText', {
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
          const quoteData = await this.getQuotationForDate(targetDate, 'AU');
          sessionData.goldPrice = quoteData.price;
          const historico = sessionData.description || `Depósito Cliente ${sessionData.selectedClienteName || ''}`;
          sessionData.description = historico;
          await this.saveTelegramSession(chatId, session.fileId, sessionData);

          const { text: confirmText, inline_keyboard } = await this.buildDepositConfirmation(sessionData, quoteData);

          await this.callTelegramApi('editMessageText', {
            chat_id: chatId,
            message_id: messageId,
            text: confirmText,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard },
          });
          return { ok: true };
        } else {
          sessionData.waitingFor = 'valor_deposito_cliente';
          await this.saveTelegramSession(chatId, session.fileId, sessionData);

          const text = `💰 *VALOR DO DEPÓSITO*\n\n• Cliente: *${sessionData.selectedClienteName || 'Cliente'}*\n• Destino: *${dest.nome}*\n\n👉 *Digite o valor depositado em R$* no chat (ex: *6472* ou *6472 em 28/08*):`;
          await this.callTelegramApi('editMessageText', {
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
        const quoteData = await this.getQuotationForDate(targetDate, 'AU');
        const goldPrice = sessionData.customQuotation || sessionData.goldPrice || quoteData.price;
        const cotacaoBase = sessionData.customQuotation ? 'Personalizada' : quoteData.dateBase;
        const historico = sessionData.description || `Depósito Cliente ${sessionData.selectedClienteName || ''} via Telegram`;

        const res = await this.transferToSupplier({
          sourceAccountId: sessionData.selectedClienteId,
          destinationAccountId: sessionData.destinationAccountId,
          amount: sessionData.amount,
          quotation: goldPrice,
          date: targetDate.toISOString(),
          description: historico,
        });

        if (session.fileId && res.debitTransactionId) {
          await this.uploadTelegramFileToS3(session.fileId, res.debitTransactionId);
          if (res.creditTransactionId) {
            await this.uploadTelegramFileToS3(session.fileId, res.creditTransactionId);
          }
        }

        const goldAmount = goldPrice > 0 ? sessionData.amount / goldPrice : 0;
        await this.clearTelegramSession(chatId);

        const formattedAmount = (sessionData.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const dateLabel = targetDate.toLocaleDateString('pt-BR');
        const confirmText = `🎉 *DEPÓSITO REGISTRADO COM SUCESSO!*\n\n• Cliente: *${sessionData.selectedClienteName || 'Cliente'}*\n• Destino: *${sessionData.destinationName}*\n• Valor: *R$ ${formattedAmount}*\n• Histórico: *${historico}*\n• Data da Operação: *${dateLabel}*\n• Cotação Au (${cotacaoBase}): *R$ ${goldPrice},00 / g*\n• Equiv. Ouro: *${goldAmount.toFixed(3)} g de Au*\n\n✅ Saldo creditado na conta de destino\n✅ Débito registrado na conta do cliente\n📎 Comprovante arquivado no AWS S3`;

        await this.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: confirmText,
          parse_mode: 'Markdown',
        });
        return { ok: true };
      }

      if (data === 'mudar_cot_dep') {
        sessionData.waitingFor = 'cotacao_deposito';
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const currentPrice = sessionData.customQuotation || sessionData.goldPrice || 715;
        const text = `🟡 *ALTERAR COTAÇÃO DO OURO (AU)*\n\n• Cotação atual: *R$ ${currentPrice},00 / g*\n\n👉 *Digite a nova cotação do ouro em R$* no chat (ex: *720* ou *718,50*):`;
        await this.callTelegramApi('editMessageText', {
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
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const text = '📝 *DIGITE O HISTÓRICO DO DEPÓSITO*\n\n👉 Digite o texto do histórico no chat (ex: *Adiantamento de pedido*, *Depósito referente à fatura 123*, etc):';
        await this.callTelegramApi('editMessageText', {
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
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const text = '📅 *DIGITE A DATA DA OPERAÇÃO*\n\n👉 Digite a data do comprovante no chat (ex: *28/08/2026* ou *28/08*):';
        await this.callTelegramApi('editMessageText', {
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
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

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

        await this.callTelegramApi('editMessageText', {
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
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const text = '🔍 *BUSCAR CATEGORIA NO PLANO DE CONTAS*\n\n👉 Digite no chat parte do nome da despesa (ex: *motoboy, química, software, luciano, combustível, marketing...*):';
        await this.callTelegramApi('editMessageText', {
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
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const text = `💳 *CATEGORIA: ${sessionData.selectedCategoryName.toUpperCase()}*\n\n👉 *Digite o valor pago em R$* no chat agora mesmo (ex: 270 ou 270,50):`;
        await this.callTelegramApi('editMessageText', {
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
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const text = `💳 *CATEGORIA: ${chosen.nome.toUpperCase()}*\n\n👉 *Digite o valor pago em R$* no chat agora mesmo (ex: 270 ou 270,50):`;
        await this.callTelegramApi('sendMessage', {
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
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const text = '🔍 *BUSCAR CONTA CORRENTE*\n\n👉 Digite o nome da conta que procura (ex: *cennabras, cheques, bsa, prata...*):';
        await this.callTelegramApi('sendMessage', {
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
        const quoteData = await this.getQuotationForDate(targetDate, 'AU');
        sessionData.goldPrice = quoteData.price;
        const catLabel = (sessionData.selectedCategoryName || sessionData.selectedCategory || 'GERAIS').toUpperCase();
        const historico = sessionData.description || `Pago referente a ${catLabel}`;
        sessionData.description = historico;
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const { text: confirmText, inline_keyboard } = await this.buildExpenseConfirmation(sessionData, quoteData);

        await this.callTelegramApi('editMessageText', {
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
        const quoteData = await this.getQuotationForDate(targetDate, 'AU');
        const goldPrice = sessionData.customQuotation || sessionData.goldPrice || quoteData.price;
        const historico = sessionData.description || `Pago referente a ${(sessionData.selectedCategoryName || 'DESPESA').toUpperCase()}`;

        const res = await this.createDirectExpense({
          amount: sessionData.amount || 0,
          contaCorrenteId: sessionData.destinationAccountId,
          categoria: sessionData.selectedCategory || 'gerais',
          quotation: goldPrice,
          description: historico,
          date: targetDate.toISOString(),
        });

        if (session.fileId && res.transactionId) {
          await this.uploadTelegramFileToS3(session.fileId, res.transactionId);
        }

        await this.clearTelegramSession(chatId);

        const dateLabel = targetDate.toLocaleDateString('pt-BR');
        const confirmText = `🎉 *PAGAMENTO REGISTRADO COM SUCESSO!*\n\n${res.message}\n\n• Histórico: *${historico}*\n• Data da Operação: *${dateLabel}*\n✅ Débito efetuado em ${res.contaCorrenteNome}\n📊 Conta: ${res.categoriaNome}\n🟡 Conversão: ${Number(res.goldAmount).toFixed(3)} g de Au (cotação R$ ${res.goldPrice},00)\n📎 Comprovante salvo no AWS S3`;

        await this.callTelegramApi('editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: confirmText,
          parse_mode: 'Markdown',
        });
        return { ok: true };
      }

      if (data === 'mudar_cot_desp') {
        sessionData.waitingFor = 'cotacao_despesa';
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const currentPrice = sessionData.customQuotation || sessionData.goldPrice || 715;
        const text = `🟡 *ALTERAR COTAÇÃO DO OURO (AU)*\n\n• Cotação atual: *R$ ${currentPrice},00 / g*\n\n👉 *Digite a nova cotação do ouro em R$* no chat (ex: *720* ou *718,50*):`;
        await this.callTelegramApi('editMessageText', {
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
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const text = '📝 *DIGITE O HISTÓRICO DA DESPESA*\n\n👉 Digite o texto do histórico no chat (ex: *Pago para fulano referente a frete de SP*, *Compra de suprimentos*, etc):';
        await this.callTelegramApi('editMessageText', {
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
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const text = '📅 *DIGITE A DATA DA OPERAÇÃO*\n\n👉 Digite a data do comprovante/pagamento no chat (ex: *28/08/2026* ou *28/08*):';
        await this.callTelegramApi('editMessageText', {
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
    }

    // 2. TRATAMENTO DE MENSAGENS RECEBIDAS (FOTO, PDF OU TEXTO)
    const msg = update.message || update.channel_post;
    if (msg) {
      const chatId = msg.chat?.id;
      const text = (msg.text || '').trim();
      const session = await this.getTelegramSession(chatId);
      const sessionData = session.data || {};

      // A) Usuário enviou foto ou documento (comprovante)
      if (msg.photo || msg.document) {
        let fileId = '';
        if (Array.isArray(msg.photo) && msg.photo.length > 0) {
          fileId = msg.photo[msg.photo.length - 1].file_id;
        } else if (msg.document) {
          fileId = msg.document.file_id;
        }

        await this.saveTelegramSession(chatId, fileId, sessionData);

        const replyText =
          '🏢 *ELECTROSAL - GESTÃO FINANCEIRA*\n\n📸 *Comprovante recebido e anexado à sessão!*\n\nEscolha a operação para este comprovante:';
        const inline_keyboard = [
          [
            { text: '💰 Recebimento de Cliente', callback_data: 'menu_rec' },
            { text: '💸 Pagamento / Despesa', callback_data: 'menu_desp' },
          ],
          [
            { text: '📊 Cotações de Hoje', callback_data: 'menu_cotacoes' },
            { text: '❌ Cancelar', callback_data: 'cancelar' },
          ],
        ];

        await this.callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: replyText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }

      // B) Usuário digitou o valor de uma despesa
      if (sessionData.waitingFor === 'valor_despesa') {
        const { amount, date, description } = this.parseValueAndDate(text);
        if (amount) {
          sessionData.amount = amount;
          if (date) {
            sessionData.operationDate = date.toISOString();
          }
          if (description) {
            sessionData.description = description;
          }
          sessionData.waitingFor = null;
          await this.saveTelegramSession(chatId, session.fileId, sessionData);

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

          await this.callTelegramApi('sendMessage', {
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
        const { amount, date, description } = this.parseValueAndDate(text);
        if (amount) {
          sessionData.amount = amount;
          if (date) {
            sessionData.operationDate = date.toISOString();
          }
          if (description) {
            sessionData.description = description;
          }

          const targetDate = sessionData.operationDate ? new Date(sessionData.operationDate) : new Date();
          const quoteData = await this.getQuotationForDate(targetDate, 'AU');
          sessionData.goldPrice = quoteData.price;
          const historico = sessionData.description || `Depósito Cliente ${sessionData.selectedClienteName || ''}`;
          sessionData.description = historico;
          sessionData.waitingFor = null;
          await this.saveTelegramSession(chatId, session.fileId, sessionData);

          const { text: confirmText, inline_keyboard } = await this.buildDepositConfirmation(sessionData, quoteData);

          await this.callTelegramApi('sendMessage', {
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
        const parsed = this.parseDateOnly(text);
        if (parsed) {
          sessionData.operationDate = parsed.toISOString();
          sessionData.waitingFor = null;

          const targetDate = parsed;
          const quoteData = await this.getQuotationForDate(targetDate, 'AU');
          sessionData.goldPrice = quoteData.price;
          await this.saveTelegramSession(chatId, session.fileId, sessionData);

          const { text: confirmText, inline_keyboard } = await this.buildDepositConfirmation(sessionData, quoteData);

          await this.callTelegramApi('sendMessage', {
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
        const parsed = this.parseDateOnly(text);
        if (parsed) {
          sessionData.operationDate = parsed.toISOString();
          sessionData.waitingFor = null;

          const targetDate = parsed;
          const quoteData = await this.getQuotationForDate(targetDate, 'AU');
          sessionData.goldPrice = quoteData.price;
          await this.saveTelegramSession(chatId, session.fileId, sessionData);

          const { text: confirmText, inline_keyboard } = await this.buildExpenseConfirmation(sessionData, quoteData);

          await this.callTelegramApi('sendMessage', {
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
        const quoteData = await this.getQuotationForDate(targetDate, 'AU');
        sessionData.goldPrice = quoteData.price;
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const { text: confirmText, inline_keyboard } = await this.buildExpenseConfirmation(sessionData, quoteData);

        await this.callTelegramApi('sendMessage', {
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
        const quoteData = await this.getQuotationForDate(targetDate, 'AU');
        sessionData.goldPrice = quoteData.price;
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

        const { text: confirmText, inline_keyboard } = await this.buildDepositConfirmation(sessionData, quoteData);

        await this.callTelegramApi('sendMessage', {
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
          const quoteData = await this.getQuotationForDate(targetDate, 'AU');
          await this.saveTelegramSession(chatId, session.fileId, sessionData);

          const { text: confirmText, inline_keyboard } = await this.buildDepositConfirmation(sessionData, quoteData);

          await this.callTelegramApi('sendMessage', {
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
          const quoteData = await this.getQuotationForDate(targetDate, 'AU');
          await this.saveTelegramSession(chatId, session.fileId, sessionData);

          const { text: confirmText, inline_keyboard } = await this.buildExpenseConfirmation(sessionData, quoteData);

          await this.callTelegramApi('sendMessage', {
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
        const search = await this.searchLookup({ type: 'categoria', q: text });
        const results = search.results || [];
        sessionData.cachedSearchCategories = results;
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

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

        await this.callTelegramApi('sendMessage', {
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
        const search = await this.searchLookup({ type: 'conta', q: text });
        const results = search.results || [];
        sessionData.cachedSearchAccounts = results;
        await this.saveTelegramSession(chatId, session.fileId, sessionData);

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

        await this.callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: replyText,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard },
        });
        return { ok: true };
      }

      // E) Mensagem geral (ex: menu, ola, /start)
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
          { text: '📊 Cotações de Hoje', callback_data: 'menu_cotacoes' },
          { text: '❌ Cancelar', callback_data: 'cancelar' },
        ],
      ];

      await this.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: replyText,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      return { ok: true };
    }

    return { ok: true };
  }
}
