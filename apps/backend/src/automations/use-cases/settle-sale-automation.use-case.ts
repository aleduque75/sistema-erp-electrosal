import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaService } from '../../media/media.service';
import { TelegramBotService } from '../services/telegram-bot.service';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';
import Decimal from 'decimal.js';

@Injectable()
export class SettleSaleAutomationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly telegramBotService: TelegramBotService,
    private readonly calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
  ) {}

  async execute(dto: {
    saleId: string;
    contaCorrenteId?: string;
    existingTransacaoId?: string;
    amount?: number;
    date?: string;
    quotation?: number;
    observation?: string;
    fileBase64?: string;
    mimeType?: string;
    fileId?: string;
  }) {
    const organizationId = this.telegramBotService.getOrganizationId();
    const { saleId } = dto;

    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, organizationId },
      include: {
        pessoa: true,
        accountsRec: {
          include: {
            saleInstallments: true,
            transacoes: true,
          },
          orderBy: { dueDate: 'asc' },
        },
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
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
    }

    let existingTx: any = null;
    let contaCorrente: any = null;

    if (dto.existingTransacaoId) {
      existingTx = await this.prisma.transacao.findFirst({
        where: { id: dto.existingTransacaoId, organizationId },
        include: { contaCorrente: true },
      });
      if (!existingTx) {
        throw new NotFoundException(`Transação com ID ${dto.existingTransacaoId} não encontrada.`);
      }
      contaCorrente = existingTx.contaCorrente;
    } else if (dto.contaCorrenteId) {
      contaCorrente = await this.prisma.contaCorrente.findFirst({
        where: { id: dto.contaCorrenteId, organizationId },
      });
      if (!contaCorrente) {
        throw new NotFoundException(`Conta Corrente com ID ${dto.contaCorrenteId} não encontrada.`);
      }
    } else {
      throw new BadRequestException('Conta Corrente ou Transação Existente deve ser informada.');
    }

    // Buscar cotações do dia / data da operação
    const paymentDate = dto.date ? new Date(dto.date) : (existingTx?.dataHora ? new Date(existingTx.dataHora) : new Date());
    const [quoteAu, quoteAg] = await Promise.all([
      this.telegramBotService.getQuotationForDate(paymentDate, 'AU'),
      this.telegramBotService.getQuotationForDate(paymentDate, 'AG'),
    ]);
    const auPrice = quoteAu.price || 715;
    const agPrice = quoteAg.price || 6.5;

    // Localizar título a receber pendente
    let targetRec = sale.accountsRec.find((ar) => !ar.received);

    // Se a venda não tiver nenhum AccountRec ainda (ex: criada como pendente avulsa)
    if (!targetRec && sale.accountsRec.length === 0) {
      const netVal = Number(sale.netAmount || sale.totalAmount || 0);
      const goldVal = sale.goldValue ? Number(sale.goldValue) : (auPrice > 0 ? netVal / auPrice : 0);

      targetRec = await this.prisma.accountRec.create({
        data: {
          organizationId,
          saleId: sale.id,
          description: `Recebimento da Venda #${sale.orderNumber}`,
          amount: new Decimal(netVal),
          goldAmount: new Decimal(goldVal),
          dueDate: sale.createdAt || paymentDate,
          received: false,
          amountPaid: new Decimal(0),
          goldAmountPaid: new Decimal(0),
          contaCorrenteId: contaCorrente.id,
        },
        include: {
          saleInstallments: true,
          transacoes: true,
        },
      });
    } else if (!targetRec) {
      targetRec = sale.accountsRec[sale.accountsRec.length - 1];
    }

    // Calcular valores a pagar e saldo pendente
    const info = this.telegramBotService.resolveReceivableInfo(targetRec, auPrice, agPrice);
    const quotation = dto.quotation && dto.quotation > 0
      ? dto.quotation
      : (existingTx?.goldPrice ? Number(existingTx.goldPrice) : (info.isSilver ? agPrice : auPrice));

    const remainingPending = Math.max(0, Number(targetRec.amount) - Number(targetRec.amountPaid || 0));

    let payAmount = dto.amount && dto.amount > 0 ? Number(dto.amount) : (existingTx ? Number(existingTx.valor) : remainingPending);
    if (payAmount <= 0) {
      payAmount = remainingPending > 0 ? remainingPending : Number(sale.netAmount || sale.totalAmount || 0);
    }

    const goldAmount = quotation > 0 ? payAmount / quotation : 0;

    // Determinar conta contábil para o crédito do recebimento do pedido (Cliente)
    // Nunca deve ser Fornecedores (Passivo). Prioriza "Contas a Receber de Clientes" (1.1.3) ou Receita Padrão.
    let contaContabilId: string | undefined;

    // 1. Tentar conta "Contas a Receber de Clientes" (código 1.1.3 ou por nome)
    const contaClientes = await this.prisma.contaContabil.findFirst({
      where: {
        organizationId,
        OR: [
          { codigo: '1.1.3' },
          { nome: { contains: 'Contas a Receber', mode: 'insensitive' } },
        ],
        aceitaLancamento: true,
      },
    });

    if (contaClientes) {
      contaContabilId = contaClientes.id;
    } else {
      // 2. Tentar UserSettings defaultReceitaContaId
      const userSettings = await this.prisma.userSettings.findFirst({
        where: { user: { organizationId } },
      });
      if (userSettings?.defaultReceitaContaId) {
        contaContabilId = userSettings.defaultReceitaContaId;
      }
    }

    // 3. Fallback para primeira conta de RECEITA ativa
    if (!contaContabilId) {
      const receitaConta = await this.prisma.contaContabil.findFirst({
        where: {
          organizationId,
          tipo: 'RECEITA',
          aceitaLancamento: true,
        },
        orderBy: { codigo: 'asc' },
      });
      contaContabilId = receitaConta?.id;
    }

    if (!contaContabilId) {
      const ativoConta = await this.prisma.contaContabil.findFirst({
        where: { organizationId, aceitaLancamento: true },
      });
      contaContabilId = ativoConta?.id;
    }

    if (!contaContabilId) {
      throw new BadRequestException('Nenhuma conta contábil encontrada para registrar o recebimento.');
    }

    // Executar baixa no banco de dados via transação segura
    const result = await this.prisma.$transaction(async (tx) => {
      let transacao: any;

      if (existingTx) {
        // 1. Vincular transação já existente ao AccountRec sem duplicar
        transacao = await tx.transacao.update({
          where: { id: existingTx.id },
          data: {
            accountRecId: targetRec.id,
            goldAmount: new Decimal(goldAmount).toDecimalPlaces(4),
            goldPrice: new Decimal(quotation),
          },
        });
      } else {
        // 1. Criar nova transação de crédito na conta corrente
        const desc =
          dto.observation ||
          `Recebimento Pedido #${sale.orderNumber} - ${(sale.pessoa?.name || 'Cliente').trim()}`;

        transacao = await tx.transacao.create({
          data: {
            organizationId,
            tipo: 'CREDITO',
            valor: new Decimal(payAmount),
            moeda: 'BRL',
            goldAmount: new Decimal(goldAmount).toDecimalPlaces(4),
            goldPrice: new Decimal(quotation),
            descricao: desc,
            dataHora: paymentDate,
            contaCorrenteId: contaCorrente.id,
            contaContabilId,
            accountRecId: targetRec.id,
          },
        });
      }

      // 2. Atualizar AccountRec com novos totais pagos
      const prevAmountPaid = Number(targetRec.amountPaid || 0);
      const prevGoldPaid = Number(targetRec.goldAmountPaid || 0);
      const newAmountPaid = Number(new Decimal(prevAmountPaid).plus(payAmount).toFixed(2));
      const newGoldPaid = Number(new Decimal(prevGoldPaid).plus(goldAmount).toFixed(4));
      const isFullyPaid = newAmountPaid >= (Number(targetRec.amount) - 0.01);

      const updatedRec = await tx.accountRec.update({
        where: { id: targetRec.id },
        data: {
          amountPaid: new Decimal(newAmountPaid),
          goldAmountPaid: new Decimal(newGoldPaid),
          received: isFullyPaid,
          receivedAt: isFullyPaid ? paymentDate : targetRec.receivedAt,
          contaCorrenteId: contaCorrente.id,
        },
      });

      // 3. Atualizar parcelas vinculadas (SaleInstallments), se houver
      if (targetRec.saleInstallments && targetRec.saleInstallments.length > 0) {
        for (const inst of targetRec.saleInstallments) {
          await tx.saleInstallment.update({
            where: { id: inst.id },
            data: {
              status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
              paidAt: isFullyPaid ? paymentDate : inst.paidAt,
            },
          });
        }
      }

      // 4. Se o título foi quitado, verificar se todos os títulos da venda foram quitados
      if (isFullyPaid) {
        const otherPending = await tx.accountRec.count({
          where: {
            saleId: sale.id,
            id: { not: targetRec.id },
            received: false,
          },
        });

        if (otherPending === 0) {
          await tx.sale.update({
            where: { id: sale.id },
            data: { status: 'FINALIZADO' },
          });
        }
      } else {
        await tx.sale.update({
          where: { id: sale.id },
          data: { status: 'PENDENTE' },
        });
      }

      return {
        transacao,
        updatedRec,
        isFullyPaid,
        newAmountPaid,
        remainingAmount: Math.max(0, Number(targetRec.amount) - newAmountPaid),
      };
    });

    // 5. Upload de comprovante para o AWS S3 anexado à transação
    if (dto.fileBase64) {
      try {
        const buffer = Buffer.from(dto.fileBase64, 'base64');
        const multerFile = {
          buffer,
          originalname: `comprovante-venda-${sale.orderNumber}-${Date.now()}.jpg`,
          mimetype: dto.mimeType || 'image/jpeg',
          size: buffer.length,
        } as Express.Multer.File;

        await this.mediaService.create(multerFile, organizationId, {
          transacaoId: result.transacao.id,
        });
      } catch (err) {
        console.error('Erro ao fazer upload do comprovante para AWS S3:', err);
      }
    } else if (dto.fileId && result.transacao.id) {
      await this.telegramBotService.uploadTelegramFileToS3(dto.fileId, result.transacao.id);
    }

    // 6. Recalcular lucro e ajustes da venda automaticamente
    let netProfitBRL: number | null = null;
    let netDiscrepancyGrams: number | null = null;

    try {
      await this.calculateSaleAdjustmentUseCase.execute(sale.id, organizationId);
      const adjustment = await this.prisma.saleAdjustment.findUnique({
        where: { saleId: sale.id },
      });
      if (adjustment) {
        netProfitBRL = Number(adjustment.netProfitBRL);
        netDiscrepancyGrams = Number(adjustment.netDiscrepancyGrams);
      }
    } catch (err) {
      console.error(`Erro ao recalcular ajuste da venda #${sale.orderNumber}:`, err);
    }

    const valorFormatado = payAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    let msg = `Venda #${sale.orderNumber} (${sale.pessoa?.name}) baixada com sucesso e creditada em ${contaCorrente.nome} (R$ ${valorFormatado})!`;
    if (existingTx) {
      msg = `Venda #${sale.orderNumber} vinculada com sucesso ao lançamento existente em ${contaCorrente.nome} (R$ ${valorFormatado}) sem duplicar saldo!`;
    } else if (!result.isFullyPaid) {
      msg = `Baixa parcial de R$ ${valorFormatado} registrada na Venda #${sale.orderNumber}! Restam R$ ${result.remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendentes.`;
    }

    return {
      success: true,
      message: msg,
      isFullyPaid: result.isFullyPaid,
      paidAmount: payAmount,
      remainingAmount: result.remainingAmount,
      orderNumber: sale.orderNumber,
      clientName: sale.pessoa?.name,
      contaCorrenteNome: contaCorrente.nome,
      transacaoId: result.transacao.id,
      paymentDate,
      quotation,
      goldAmount,
      netProfitBRL,
      netDiscrepancyGrams,
      wasLinked: !!existingTx,
    };
  }
}
