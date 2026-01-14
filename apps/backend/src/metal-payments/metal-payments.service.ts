import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayClientWithMetalDto } from './dto/pay-client-with-metal.dto';
import { PureMetalLotsService } from '../pure-metal-lots/pure-metal-lots.service';
import { TransacoesService } from '../transacoes/transacoes.service';
import { QuotationsService } from '../quotations/quotations.service';
import { SettingsService } from '../settings/settings.service';
import { TipoTransacaoPrisma, TipoMetal, MetalCreditStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';

@Injectable()
export class MetalPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pureMetalLotsService: PureMetalLotsService,
    private readonly transacoesService: TransacoesService,
    private readonly quotationsService: QuotationsService,
    private readonly settingsService: SettingsService,
  ) {}

  async payClientWithMetal(organizationId: string, userId: string, dto: PayClientWithMetalDto) {
    const { clientId, pureMetalLotId, grams, notes, data } = dto;
    const transactionDate = new Date(data);

    return this.prisma.$transaction(async (tx) => {
      // 1. Verificar o lote de metal puro
      const pureMetalLot = await this.pureMetalLotsService.findOne(organizationId, pureMetalLotId);
      if (!pureMetalLot) {
        throw new NotFoundException(`Lote de metal puro com ID ${pureMetalLotId} não encontrado.`);
      }
      if (pureMetalLot.remainingGrams < grams) {
        throw new BadRequestException('Quantidade de metal insuficiente no lote.');
      }

      // 2. Registrar a saída do metal do lote
      const movement = await this.pureMetalLotsService.createPureMetalLotMovement(
        organizationId,
        pureMetalLotId,
        {
          type: 'EXIT',
          grams: grams,
          notes: `Pagamento ao cliente ${clientId} - ${notes || ''}`,
        },
        tx,
      );

      // 3. Obter a cotação de compra do metal
      const quotation = await this.quotationsService.findLatest(pureMetalLot.metalType, organizationId, transactionDate);
      if (!quotation || quotation.buyPrice.isZero()) {
        throw new BadRequestException(`Nenhuma cotação de compra para ${pureMetalLot.metalType} encontrada para a data ${transactionDate.toLocaleDateString()}.`);
      }
      const valorBRL = new Decimal(grams).times(quotation.buyPrice);

      // 4. Registrar a transação financeira (débito em Contas a Pagar, crédito em Estoque de Metal)
      const settings = await this.settingsService.findOne(userId);
      if (!settings?.productionCostAccountId || !settings?.metalStockAccountId) {
        throw new BadRequestException('Contas contábeis padrão para Contas a Pagar ou Estoque de Metal não configuradas.');
      }

      // Débito em Contas a Pagar (ou conta de despesa de pagamento)
      await this.transacoesService.create(
        {
          tipo: TipoTransacaoPrisma.DEBITO,
          valor: valorBRL.toNumber(),
          descricao: `Pagamento em metal ao cliente ${clientId} - ${notes || ''}`,
          dataHora: transactionDate,
          contaContabilId: settings.productionCostAccountId,
          goldAmount: new Decimal(grams).toNumber(),
          goldPrice: quotation.buyPrice.toNumber(),
        },
        organizationId,
        tx,
      );

      // Crédito no Estoque de Metal (saída do estoque)
      await this.transacoesService.create(
        {
          tipo: TipoTransacaoPrisma.CREDITO,
          valor: valorBRL.toNumber(),
          descricao: `Saída de metal do estoque para pagamento ao cliente ${clientId} - ${notes || ''}`,
          dataHora: transactionDate,
          contaContabilId: settings.metalStockAccountId,
          goldAmount: new Decimal(grams).negated().toNumber(), // Negativo para indicar saída
          goldPrice: quotation.buyPrice.toNumber(),
        },
        organizationId,
        tx,
      );

      // 5. Abater dos créditos de metal do cliente (FIFO)
      let remainingGramsToDeduct = new Decimal(grams);
      const openCredits = await tx.metalCredit.findMany({
        where: {
          clientId,
          organizationId,
          metalType: pureMetalLot.metalType,
          status: { in: [MetalCreditStatus.PENDING, MetalCreditStatus.PARTIALLY_PAID] },
        },
        orderBy: { date: 'asc' },
      });

      for (const credit of openCredits) {
        if (remainingGramsToDeduct.lessThanOrEqualTo(0)) break;

        const creditGrams = new Decimal(credit.grams);
        let deduction = new Decimal(0);

        if (remainingGramsToDeduct.greaterThanOrEqualTo(creditGrams)) {
          deduction = creditGrams;
        } else {
          deduction = remainingGramsToDeduct;
        }

        const newGrams = creditGrams.minus(deduction);
        const newSettledGrams = new Decimal(credit.settledGrams || 0).plus(deduction);
        const newStatus = newGrams.lessThanOrEqualTo(0.0001) ? MetalCreditStatus.PAID : MetalCreditStatus.PARTIALLY_PAID;

        await tx.metalCredit.update({
          where: { id: credit.id },
          data: {
            grams: newGrams.toNumber(),
            settledGrams: newSettledGrams.toNumber(),
            status: newStatus,
          },
        });

        remainingGramsToDeduct = remainingGramsToDeduct.minus(deduction);
      }

      // 6. Atualizar Conta Metal (MetalAccount) e criar entrada (MetalAccountEntry)
      let metalAccount = await tx.metalAccount.findUnique({
        where: {
          organizationId_personId_type: {
            organizationId,
            personId: clientId,
            type: pureMetalLot.metalType,
          },
        },
      });

      if (!metalAccount) {
        metalAccount = await tx.metalAccount.create({
          data: {
            organizationId,
            personId: clientId,
            type: pureMetalLot.metalType,
          }
        });
      }

      await tx.metalAccountEntry.create({
        data: {
          metalAccountId: metalAccount.id,
          date: transactionDate,
          description: `Pagamento em metal ao cliente (Lote: ${pureMetalLot.lotNumber || 'N/A'})`,
          grams: new Decimal(grams).negated().toNumber(),
          type: 'DEBIT',
          sourceId: movement.id, // Linking to the lot movement
        }
      });

      return { message: 'Pagamento em metal ao cliente registrado com sucesso.' };
    });
  }
}
