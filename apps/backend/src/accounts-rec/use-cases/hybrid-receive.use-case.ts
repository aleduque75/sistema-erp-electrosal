import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, MetalCreditStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { HybridReceiveDto } from '../dtos/hybrid-receive.dto';
import { Decimal } from 'decimal.js';
import { SettingsService } from '../../settings/settings.service';
import { CalculateSaleAdjustmentUseCase } from '../../sales/use-cases/calculate-sale-adjustment.use-case';
import { PureMetalLotsService } from '../../pure-metal-lots/pure-metal-lots.service';

enum TipoTransacaoPrisma {
  CREDITO = 'CREDITO',
  DEBITO = 'DEBITO',
}

@Injectable()
export class HybridReceiveUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly calculateSaleAdjustmentUseCase: CalculateSaleAdjustmentUseCase,
    private readonly pureMetalLotsService: PureMetalLotsService,
  ) {}

  async execute(
    organizationId: string,
    userId: string,
    accountRecId: string,
    dto: HybridReceiveDto,
  ) {
    const accountRec = await this.prisma.accountRec.findFirst({
      where: { id: accountRecId, organizationId },
      include: {
        sale: {
          include: {
            pessoa: true,
          },
        },
      },
    });

    if (!accountRec) {
      throw new NotFoundException('Conta a receber não encontrada.');
    }
    
    const settings = await this.settingsService.findOne(userId);
    if (!settings.defaultReceitaContaId) {
      throw new BadRequestException('Conta contábil de receita padrão não configurada.');
    }
    if (!settings.metalCreditPayableAccountId) { // Verifica a conta de passivo do crédito de metal
      throw new BadRequestException('Conta contábil de passivo de crédito de metal não configurada nas configurações.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let totalPaidBRLForAccountRec = new Decimal(0); 
      let totalPaidGoldForAccountRec = new Decimal(0); 
      const quotation = new Decimal(dto.quotation || 0);

      // --- Validar installmentId se fornecido ---
      if (dto.installmentId) {
        const installment = await tx.saleInstallment.findFirst({
          where: { id: dto.installmentId, saleId: accountRec.saleId || undefined }
        });
        if (!installment) {
          throw new BadRequestException('A parcela informada não pertence a esta venda ou não existe.');
        }
      }

      // --- NOVO: Processar transferências para outros MetalCredits ANTES de aplicar à AccountRec atual ---
      if (dto.transferToOtherMetalCredits && dto.transferToOtherMetalCredits.length > 0) {
        for (const transfer of dto.transferToOtherMetalCredits) {
          const targetMetalCredit = await tx.metalCredit.findFirst({
            where: { id: transfer.metalCreditId, organizationId },
          });

          if (!targetMetalCredit) {
            throw new NotFoundException(`Crédito de metal de destino com ID ${transfer.metalCreditId} não encontrado.`);
          }
          // Verificar se o metalCredit pertence a outra pessoa que não a da venda principal,
          // ou se for a mesma, é um cenário de "auto-transferência"
          if (targetMetalCredit.clientId === accountRec.sale?.pessoaId) {
            throw new BadRequestException(`Transferência para o próprio cliente da venda não permitida via este fluxo. Use o pagamento direto com crédito de metal.`);
          }

          if (new Decimal(targetMetalCredit.grams).lt(transfer.grams)) {
            throw new BadRequestException(`Saldo de crédito de metal (${targetMetalCredit.id}) insuficiente para a transferência. Saldo: ${new Decimal(targetMetalCredit.grams).toDecimalPlaces(4).toNumber()}, Solicitado: ${new Decimal(transfer.grams).toDecimalPlaces(4).toNumber()}`);
          }
          if (new Decimal(transfer.quotation).isZero() || new Decimal(transfer.quotation).isNegative()) {
            throw new BadRequestException('A cotação para transferência de crédito de metal deve ser positiva.');
          }

          const transferGrams = new Decimal(transfer.grams);
          const transferQuotation = new Decimal(transfer.quotation);
          const transferValueBRL = transferGrams.times(transferQuotation).toDecimalPlaces(2);


          // 1. Atualizar o MetalCredit de destino
          const updatedTargetCredit = await tx.metalCredit.update({
            where: { id: targetMetalCredit.id },
            data: { 
                grams: { decrement: transferGrams.toNumber() },
                settledGrams: { increment: transferGrams.toNumber() }
            },
          });
          const remainingGrams = new Decimal(updatedTargetCredit.grams);
          let newStatus: MetalCreditStatus = MetalCreditStatus.PARTIALLY_PAID;
          if (remainingGrams.isZero() || remainingGrams.lt(0.0001)) { // Usar tolerância
             newStatus = MetalCreditStatus.PAID;
          }
           await tx.metalCredit.update({
                where: { id: targetMetalCredit.id },
                data: { status: newStatus },
           });

          // 2. Criar MetalAccountEntry para o cliente de destino
          const targetMetalAccount = await tx.metalAccount.findFirst({
            where: {
              personId: targetMetalCredit.clientId,
              type: targetMetalCredit.metalType,
              organizationId: organizationId,
            }
          });
          if (!targetMetalAccount) {
            throw new NotFoundException(`Conta de metal para o cliente de destino (${targetMetalCredit.clientId}) não encontrada.`);
          }
          await tx.metalAccountEntry.create({
            data: {
              metalAccountId: targetMetalAccount.id,
              date: new Date(dto.receivedAt),
              description: `Pagamento de crédito de metal via transferência de recebimento de venda #${accountRec.sale?.orderNumber || accountRec.description}`,
              grams: transferGrams.negated().toDecimalPlaces(4).toNumber(), // Débito na conta de metal do cliente
              type: 'TRANSFER_IN', // Tipo alterado para indicar entrada de recursos
              sourceId: accountRec.id, // O AccountRec principal como origem da transferência
            }
          });

          // 3. Criar Transações Financeiras (Débito e Crédito) para representar a transferência contábil
          // Débito no passivo (metalCreditPayableAccountId) - reduz a dívida da empresa
          const debitTransacao = await tx.transacao.create({
            data: {
              organizationId,
              contaContabilId: settings.metalCreditPayableAccountId!, // Conta de passivo do crédito de metal
              valor: transferValueBRL.toNumber(),
              goldAmount: transferGrams.negated().toDecimalPlaces(4).toNumber(), // Ouro sai do passivo da empresa
              dataHora: new Date(dto.receivedAt),
              descricao: `Transferência de recebimento de Venda #${accountRec.sale?.orderNumber || accountRec.description} para pagar Crédito de Metal (${targetMetalCredit.clientId})`,
              tipo: TipoTransacaoPrisma.DEBITO,
              moeda: 'BRL',
              // NÃO associar accountRecId aqui, pois não está quitando esta accountRec
            }
          });

          // Crédito na receita (defaultReceitaContaId) - representa a "receita" utilizada
          // para quitar o passivo, ou seja, o valor que viria da venda principal
          // e foi alocado para essa finalidade.
          const creditTransacao = await tx.transacao.create({
            data: {
              organizationId,
              contaContabilId: settings.defaultReceitaContaId!, // Conta de Receita (ou uma de Compensação se definida)
              valor: transferValueBRL.toNumber(),
              goldAmount: transferGrams.toDecimalPlaces(4).toNumber(), // Ouro "entra" na receita da empresa
              dataHora: new Date(dto.receivedAt),
              descricao: `Recebimento de Transferência para Crédito de Metal (${targetMetalCredit.clientId}) da Venda #${accountRec.sale?.orderNumber || accountRec.description}`,
              tipo: TipoTransacaoPrisma.CREDITO,
              moeda: 'BRL',
              // NÃO associar accountRecId aqui, pois não está quitando esta accountRec
            }
          });

          // Vincular as transações
          await tx.transacao.update({
            where: { id: debitTransacao.id },
            data: { linkedTransactionId: creditTransacao.id },
          });
          await tx.transacao.update({
            where: { id: creditTransacao.id },
            data: { linkedTransactionId: debitTransacao.id },
          });

          // Não ajustar totalPaidBRLForAccountRec ou totalPaidGoldForAccountRec aqui.
          // Esses valores representam o que é *realmente* aplicado à AccountRec da venda.
          // A transferência é um desvio de recursos antes de aplicar na AccountRec.
        }
      }
      // --- FIM DA LÓGICA DE TRANSFERÊNCIA ---

      if (dto.financialPayments && dto.financialPayments.length > 0) {
        for (const payment of dto.financialPayments) {
          const paymentDate = payment.receivedAt ? new Date(payment.receivedAt) : new Date(dto.receivedAt);
          const paymentQuotation = payment.quotation ? new Decimal(payment.quotation) : new Decimal(dto.quotation || 0);

          if (paymentQuotation.isZero() && totalPaidGoldForAccountRec.gt(0)) {
             // Fallback check: If we are paying a gold debt (implied by previous gold payments or accountRec structure), we might need a quotation.
             // However, for pure financial payment on a BRL debt, we might not need it.
             // But the original code enforced it if totalPaidGold > 0.
             // Let's keep a check but based on the specific payment context if possible.
             // The original check was: if (quotation.isZero() && totalPaidGoldForAccountRec.gt(0))
             throw new BadRequestException('Cotação é necessária para pagamentos financeiros em dívidas de metal (verifique se a cotação foi informada no item ou no cabeçalho).');
          }

          // Calculate Gold Equivalent for this specific payment
          let financialGoldEquivalent = new Decimal(0);
          if (paymentQuotation.gt(0)) {
            financialGoldEquivalent = new Decimal(payment.amount).dividedBy(paymentQuotation);
          } else if (accountRec.goldAmount && new Decimal(accountRec.goldAmount).gt(0)) {
             throw new BadRequestException('Cotação é obrigatória para pagamento financeiro de dívida em ouro.');
          }

          await tx.transacao.create({
            data: {
              organizationId,
              contaCorrenteId: payment.contaCorrenteId,
              accountRecId: accountRec.id,
              valor: payment.amount,
              goldAmount: financialGoldEquivalent.toDP(4).toNumber(),
              dataHora: paymentDate,
              descricao: `Recebimento Ref. ${accountRec.description}`,
              tipo: TipoTransacaoPrisma.CREDITO,
              moeda: 'BRL',
              contaContabilId: settings.defaultReceitaContaId!,
            } as Prisma.TransacaoUncheckedCreateInput,
          });
          totalPaidBRLForAccountRec = totalPaidBRLForAccountRec.plus(payment.amount);
          totalPaidGoldForAccountRec = totalPaidGoldForAccountRec.plus(financialGoldEquivalent);
        }
      }

      if (dto.metalCreditPayments && dto.metalCreditPayments.length > 0) {
        if (!accountRec.sale) {
          throw new BadRequestException(
            'Pagamentos com crédito de metal só podem ser aplicados a contas a receber de vendas.',
          );
        }
        for (const payment of dto.metalCreditPayments) {
          const paymentDate = payment.receivedAt ? new Date(payment.receivedAt) : new Date(dto.receivedAt);
          const paymentQuotation = payment.quotation ? new Decimal(payment.quotation) : new Decimal(dto.quotation || 0);

          if (paymentQuotation.isZero()) {
             throw new BadRequestException('Cotação é necessária para pagamentos com metal.');
          }

          const metalCredit = await tx.metalCredit.findFirst({
            where: { id: payment.metalCreditId, organizationId },
          });

          if (!metalCredit) {
            throw new NotFoundException(`Crédito de metal ${payment.metalCreditId} não encontrado.`);
          }
          if (new Decimal(metalCredit.grams).lt(payment.amountInGrams)) {
            throw new BadRequestException('Saldo de crédito de metal insuficiente.');
          }

          const updatedCredit = await tx.metalCredit.update({
            where: { id: payment.metalCreditId },
            data: { 
                grams: { decrement: payment.amountInGrams },
                settledGrams: { increment: payment.amountInGrams }
            },
          });
          
          const remainingGrams = new Decimal(updatedCredit.grams);
          let newStatus: MetalCreditStatus = MetalCreditStatus.PARTIALLY_PAID;
          if (remainingGrams.isZero() || remainingGrams.lt(0.0001)) { // Usar tolerância
             newStatus = MetalCreditStatus.PAID;
          }
           await tx.metalCredit.update({
                where: { id: payment.metalCreditId },
                data: { status: newStatus },
           });

          const metalAccount = await tx.metalAccount.findFirst({
            where: {
              personId: accountRec.sale.pessoaId,
              type: metalCredit.metalType,
              organizationId: organizationId,
            }
          });

          if (!metalAccount) {
            throw new NotFoundException(`Conta de metal para o cliente não encontrada.`);
          }

          await tx.metalAccountEntry.create({
            data: {
              metalAccountId: metalAccount.id,
              date: paymentDate,
              description: `Pagamento da Venda #${accountRec.sale?.orderNumber}`,
              grams: new Decimal(payment.amountInGrams).negated().toDecimalPlaces(4).toNumber(), // Débito na conta do cliente
              type: 'DEBIT',
              sourceId: accountRec.saleId,
            }
          });

          const valorBRL = new Decimal(payment.amountInGrams).times(paymentQuotation).toDecimalPlaces(2);
          await tx.transacao.create({
            data: {
              organizationId,
              accountRecId: accountRec.id,
              valor: valorBRL.toNumber(),
              goldAmount: new Decimal(payment.amountInGrams).toDecimalPlaces(4).toNumber(),
              dataHora: paymentDate,
              descricao: `Pagamento com crédito de metal - Venda #${accountRec.sale?.orderNumber}`,
              tipo: TipoTransacaoPrisma.CREDITO,
              moeda: 'BRL',
              contaContabilId: settings.defaultReceitaContaId!,
            }
          });

          totalPaidBRLForAccountRec = totalPaidBRLForAccountRec.plus(valorBRL);
          totalPaidGoldForAccountRec = totalPaidGoldForAccountRec.plus(new Decimal(payment.amountInGrams));
        }
      }

      if (dto.metalPayments && dto.metalPayments.length > 0) {
        if (!accountRec.sale) {
          throw new BadRequestException('Pagamentos com metal físico só podem ser aplicados a contas a receber de vendas.');
        }
        for (const payment of dto.metalPayments) {
          const paymentDate = payment.receivedAt ? new Date(payment.receivedAt) : new Date(dto.receivedAt);
          const paymentQuotation = payment.quotation ? new Decimal(payment.quotation) : new Decimal(dto.quotation || 0);

          if (paymentQuotation.isZero()) {
             throw new BadRequestException('Cotação é necessária para pagamentos com metal.');
          }

          const description = `Pagamento da Venda #${accountRec.sale?.orderNumber} - Cliente: ${accountRec.sale?.pessoa.name}`;
          await this.pureMetalLotsService.create(
            organizationId,
            {
              sourceType: 'PAGAMENTO_PEDIDO_CLIENTE',
              sourceId: accountRec.id,
              saleId: accountRec.saleId || undefined,
              description,
              metalType: payment.metalType as any,
              initialGrams: payment.amountInGrams,
              remainingGrams: payment.amountInGrams,
              purity: payment.purity,
              notes: description,
            },
            tx,
          );

          const valorBRL = new Decimal(payment.amountInGrams).times(paymentQuotation).toDecimalPlaces(2);
          await tx.transacao.create({
            data: {
              organizationId,
              accountRecId: accountRec.id,
              valor: valorBRL.toNumber(),
              goldAmount: new Decimal(payment.amountInGrams).toDecimalPlaces(4).toNumber(),
              dataHora: paymentDate,
              descricao: `Pagamento com metal físico - Venda #${accountRec.sale?.orderNumber}`,
              tipo: TipoTransacaoPrisma.CREDITO,
              moeda: 'BRL',
              contaContabilId: settings.defaultReceitaContaId!,
            },
          });

          totalPaidBRLForAccountRec = totalPaidBRLForAccountRec.plus(valorBRL);
          totalPaidGoldForAccountRec = totalPaidGoldForAccountRec.plus(new Decimal(payment.amountInGrams));
        }
      }
      
      const updatedAmountPaid = new Decimal(accountRec.amountPaid || 0).plus(totalPaidBRLForAccountRec);
      const updatedGoldAmountPaid = new Decimal(accountRec.goldAmountPaid || 0).plus(totalPaidGoldForAccountRec);

      await tx.accountRec.update({
        where: { id: accountRec.id },
        data: {
          amountPaid: updatedAmountPaid.toDP(2).toNumber(),
          goldAmountPaid: updatedGoldAmountPaid.toDP(4).toNumber(),
        },
      });

      // --- Atualizar Parcelas (SaleInstallments) ---
      if (accountRec.saleId) {
        if (dto.installmentId) {
          // Pagamento de uma parcela específica
          await tx.saleInstallment.update({
            where: { id: dto.installmentId },
            data: {
              status: 'PAID',
              paidAt: new Date(dto.receivedAt),
            }
          });
        } else {
          // Pagamento avulso: Amortizar parcelas pendentes
          let remainingAmortization = totalPaidBRLForAccountRec;
          const pendingInstallments = await tx.saleInstallment.findMany({
            where: { saleId: accountRec.saleId, status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
            orderBy: { dueDate: 'asc' },
          });

          for (const inst of pendingInstallments) {
            if (remainingAmortization.lte(0)) break;

            const instAmount = new Decimal(inst.amount);
            if (remainingAmortization.gte(instAmount.minus(0.01))) {
              await tx.saleInstallment.update({
                where: { id: inst.id },
                data: { status: 'PAID', paidAt: new Date(dto.receivedAt) },
              });
              remainingAmortization = remainingAmortization.minus(instAmount);
            } else if (remainingAmortization.gt(0.01)) {
              await tx.saleInstallment.update({
                where: { id: inst.id },
                data: { status: 'PARTIALLY_PAID' },
              });
              remainingAmortization = new Decimal(0);
            }
          }
        }
      }

      const totalAmount = new Decimal(accountRec.amount);
      let isFullyPaid = false;

      if (accountRec.goldAmount && new Decimal(accountRec.goldAmount).gt(0)) {
        isFullyPaid = updatedGoldAmountPaid.gte(new Decimal(accountRec.goldAmount).minus(0.0001)); // Tolerância para comparação
      } else {
        isFullyPaid = updatedAmountPaid.gte(totalAmount.minus(0.01)); // Tolerância para comparação
      }


      if (isFullyPaid) {
        if (dto.finalize) {
          await tx.accountRec.update({
            where: { id: accountRec.id },
            data: { received: true, receivedAt: new Date(dto.receivedAt) },
          });

          if (accountRec.sale) {
            // Se o DTO.finalize for true, ele tem precedência e finaliza a venda.
            if (dto.finalize) {
              await tx.sale.update({
                where: { id: accountRec.saleId! },
                data: { status: 'FINALIZADO' },
              });
            } 
            // Se não, verificamos a flag da AccountRec para decidir se atualizamos o status.
            else if (!accountRec.doNotUpdateSaleStatus) {
              await tx.sale.update({
                where: { id: accountRec.saleId! },
                data: { status: 'FINALIZADO' },
              });
            }
          }
        }
        
        const overpaymentTolerance = new Decimal(1.00);
        const totalAmountInBRL = (accountRec.goldAmount && new Decimal(accountRec.goldAmount).gt(0))
          ? new Decimal(accountRec.goldAmount).times(quotation)
          : totalAmount;

        const overpayment = updatedAmountPaid.minus(totalAmountInBRL);

      }

      return { message: 'Recebimento híbrido processado com sucesso.' };
    });

    if (accountRec.saleId) {
      await this.calculateSaleAdjustmentUseCase.execute(accountRec.saleId, organizationId);
    }

    return result;
  }
}
