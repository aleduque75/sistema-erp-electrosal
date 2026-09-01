import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExpenseAutomationDto } from './dto/create-expense-automation.dto';
import { AccountsPayService } from '../accounts-pay/accounts-pay.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ConfirmSaleUseCase } from '../sales/use-cases/confirm-sale.use-case';
import { TransacoesService } from '../transacoes/transacoes.service';
import { MediaService } from '../media/media.service';
import Decimal from 'decimal.js';

@Injectable()
export class AutomationsService {
  constructor(
    private readonly accountsPayService: AccountsPayService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly confirmSaleUseCase: ConfirmSaleUseCase,
    private readonly transacoesService: TransacoesService,
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

    return this.accountsPayService.create(organizationId, createAccountPayDto);
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

    const result = await this.transacoesService.createTransfer(organizationId, {
      sourceAccountId,
      destinationAccountId,
      amount: Number(amount),
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
}
