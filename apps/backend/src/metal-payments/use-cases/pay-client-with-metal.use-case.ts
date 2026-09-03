import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MetalPaymentRepository } from '../repositories/metal-payment.repository';
import { PayClientWithMetalDto } from '../dtos/pay-client-with-metal.dto';
import { MetalPaymentEntity } from '../entities/metal-payment.entity';
import { MetalPaymentMapper, MetalPaymentResponseDto } from '../mappers/metal-payment.mapper';
import { CreateTransacaoUseCase } from '../../transacoes/use-cases/create-transacao.use-case';
import { QuotationsService } from '../../quotations/quotations.service';
import { SettingsService } from '../../settings/settings.service';
import { TipoTransacaoPrisma, MetalCreditStatus } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class PayClientWithMetalUseCase {
  constructor(
    private readonly metalPaymentRepository: MetalPaymentRepository,
    private readonly createTransacaoUseCase: CreateTransacaoUseCase,
    private readonly quotationsService: QuotationsService,
    private readonly settingsService: SettingsService,
  ) {}

  async execute(
    organizationId: string,
    userId: string,
    dto: PayClientWithMetalDto,
  ): Promise<MetalPaymentResponseDto> {
    const { clientId, pureMetalLotId, grams, notes, data } = dto;
    const paymentDate = new Date(data);

    // 1. Verificar lote de metal puro
    const pureMetalLot = await this.metalPaymentRepository.findPureMetalLot(
      pureMetalLotId,
      organizationId,
    );
    if (!pureMetalLot) {
      throw new NotFoundException(
        `Lote de metal puro com ID ${pureMetalLotId} não encontrado.`,
      );
    }

    // 2. Obter cotação atualizada do metal
    const quotation = await this.quotationsService.findLatest(
      pureMetalLot.metalType,
      organizationId,
      paymentDate,
    );
    if (!quotation || quotation.buyPrice.isZero()) {
      throw new BadRequestException(
        `Nenhuma cotação de compra para ${pureMetalLot.metalType} encontrada para a data ${paymentDate.toLocaleDateString()}.`,
      );
    }

    const quotationPrice = Number(quotation.buyPrice);

    // 3. Criar entidade de domínio rica (validações invariantes e cálculos)
    const paymentEntity = MetalPaymentEntity.create({
      organizationId,
      userId,
      clientId,
      pureMetalLotId,
      metalCreditId: dto.metalCreditId,
      grams,
      metalType: pureMetalLot.metalType,
      notes,
      data: paymentDate,
      quotationPrice,
    });

    if (!paymentEntity.hasEnoughLotBalance(pureMetalLot.remainingGrams)) {
      throw new BadRequestException('Quantidade de metal insuficiente no lote.');
    }

    const valorBRL = paymentEntity.calculateBRLValue();

    // 4. Executar fluxo atômico desacoplado
    await this.metalPaymentRepository.executeInTransaction(async (tx) => {
      // 4.1. Registrar saída física no lote
      const movement = await this.metalPaymentRepository.createLotMovement(
        pureMetalLotId,
        organizationId,
        {
          type: 'EXIT',
          grams: paymentEntity.grams.value,
          notes: `Pagamento ao cliente ${clientId} - ${notes || ''}`,
        },
        tx,
      );

      // 4.2. Registrar lançamentos contábeis via CreateTransacaoUseCase
      const settings = await this.settingsService.findOne(userId);
      if (!settings?.productionCostAccountId || !settings?.metalStockAccountId) {
        throw new BadRequestException(
          'Contas contábeis padrão para Contas a Pagar ou Estoque de Metal não configuradas.',
        );
      }

      // Débito em Contas a Pagar
      await this.createTransacaoUseCase.execute(
        {
          tipo: TipoTransacaoPrisma.DEBITO,
          valor: valorBRL.toNumber(),
          descricao: `Pagamento em metal ao cliente ${clientId} - ${notes || ''}`,
          dataHora: paymentDate,
          contaContabilId: settings.productionCostAccountId,
          goldAmount: paymentEntity.grams.value,
          goldPrice: quotationPrice,
        },
        organizationId,
        tx,
      );

      // Crédito no Estoque de Metal (saída negativa de estoque)
      await this.createTransacaoUseCase.execute(
        {
          tipo: TipoTransacaoPrisma.CREDITO,
          valor: valorBRL.toNumber(),
          descricao: `Saída de metal do estoque para pagamento ao cliente ${clientId} - ${notes || ''}`,
          dataHora: paymentDate,
          contaContabilId: settings.metalStockAccountId,
          goldAmount: paymentEntity.getStockDeductionGrams(),
          goldPrice: quotationPrice,
        },
        organizationId,
        tx,
      );

      // 4.3. Abater créditos de metal em aberto do cliente (FIFO ou direcionado)
      let remainingGramsToDeduct = paymentEntity.grams.decimal;
      const openCredits = await this.metalPaymentRepository.findOpenMetalCredits(
        clientId,
        pureMetalLot.metalType,
        organizationId,
        tx,
      );

      if (dto.metalCreditId) {
        const specificIndex = openCredits.findIndex(
          (c) => c.id === dto.metalCreditId,
        );
        if (specificIndex > -1) {
          const [specificCredit] = openCredits.splice(specificIndex, 1);
          openCredits.unshift(specificCredit);
        }
      }

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
        const newStatus = newGrams.lessThanOrEqualTo(0.0001)
          ? MetalCreditStatus.PAID
          : MetalCreditStatus.PARTIALLY_PAID;

        await this.metalPaymentRepository.updateMetalCredit(
          credit.id,
          {
            grams: newGrams.toNumber(),
            settledGrams: newSettledGrams.toNumber(),
            status: newStatus,
          },
          tx,
        );

        remainingGramsToDeduct = remainingGramsToDeduct.minus(deduction);
      }

      // 4.4. Atualizar extrato de conta corrente de metal do cliente
      const metalAccount = await this.metalPaymentRepository.findOrCreateMetalAccount(
        clientId,
        pureMetalLot.metalType,
        organizationId,
        tx,
      );

      await this.metalPaymentRepository.createMetalAccountEntry(
        {
          metalAccountId: metalAccount.id,
          date: paymentDate,
          description: `Pagamento em metal ao cliente (Lote: ${pureMetalLot.lotNumber || 'N/A'})`,
          grams: paymentEntity.getStockDeductionGrams(),
          type: 'DEBIT',
          sourceId: movement.id,
        },
        tx,
      );
    });

    return MetalPaymentMapper.toResponseDto(paymentEntity);
  }
}
