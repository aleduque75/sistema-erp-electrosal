import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayClientWithMetalDto } from './dto/pay-client-with-metal.dto';
import { PureMetalLotsService } from '../pure-metal-lots/pure-metal-lots.service';
import { TransacoesService } from '../transacoes/transacoes.service';
import { QuotationsService } from '../quotations/quotations.service';
import { SettingsService } from '../settings/settings.service';
import { TipoTransacaoPrisma, TipoMetal } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

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
      await this.pureMetalLotsService.createPureMetalLotMovement(
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
        },
        organizationId,
        tx,
      );

      return { message: 'Pagamento em metal ao cliente registrado com sucesso.' };
    });
  }
}
