import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CorrectSalesPaymentsCommand {
  startOrderNumber: number;
  organizationId: string;
}

interface CorrectionResult {
  orderNumber: number;
  status: 'SUCCESS' | 'ERROR';
  reason?: string;
}

@Injectable()
export class CorrectSalesPaymentsUseCase {
  private readonly logger = new Logger(CorrectSalesPaymentsUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CorrectSalesPaymentsCommand): Promise<any> {
    this.logger.log(
      `Iniciando correção de pagamentos para vendas a partir do pedido ${command.startOrderNumber}`,
    );

    // 1. Encontrar a conta corrente "REAÇÃO SAL 68%"
    const contaCorrente = await this.prisma.contaCorrente.findFirst({
      where: {
        nome: 'REAÇÃO SAL 68%',
        organizationId: command.organizationId,
      },
    });

    if (!contaCorrente) {
      throw new NotFoundException('Conta corrente "REAÇÃO SAL 68%" não encontrada.');
    }

    this.logger.log(`Conta corrente encontrada: ${contaCorrente.nome}`);

    // 2. Encontrar todas as vendas pagas nessa conta a partir do número do pedido
    const salesToCorrect = await this.prisma.sale.findMany({
      where: {
        organizationId: command.organizationId,
        orderNumber: {
          gte: command.startOrderNumber,
        },
        accountsRec: {
          some: {
            transacoes: {
              some: {
                contaCorrenteId: contaCorrente.id,
              },
            },
          },
        },
      },
      include: {
        saleItems: { include: { product: true } },
        accountsRec: { include: { transacoes: true } },
      },
    });

    this.logger.log(`Encontradas ${salesToCorrect.length} vendas para corrigir.`);

    const results: CorrectionResult[] = [];

    for (const sale of salesToCorrect) {
      try {
        await this.prisma.$transaction(async (tx) => {
          for (const accountRec of sale.accountsRec) {
            if (accountRec.received && accountRec.contaCorrenteId === contaCorrente.id) {
              for (const transacao of accountRec.transacoes) {
                if (transacao.tipo === 'CREDITO' && transacao.status === 'ATIVA') {
                  // 1. Estornar a transação criando uma transação de débito oposta
                  await tx.transacao.create({
                    data: {
                      organizationId: command.organizationId,
                      contaCorrenteId: transacao.contaCorrenteId,
                      contaContabilId: transacao.contaContabilId,
                      tipo: 'DEBITO',
                      valor: transacao.valor,
                      moeda: transacao.moeda,
                      descricao: `Estorno da correção da venda #${sale.orderNumber}`,
                      dataHora: new Date(),
                      status: 'AJUSTADA',
                    },
                  });

                  // 2. Marcar a transação original como ajustada
                  await tx.transacao.update({
                    where: { id: transacao.id },
                    data: { status: 'AJUSTADA' },
                  });

                  this.logger.log(`Transação ${transacao.id} da venda ${sale.orderNumber} foi estornada.`);
                }
              }
              // 3. Marcar a conta a receber como não recebida
              await tx.accountRec.update({
                where: { id: accountRec.id },
                data: { received: false, receivedAt: null },
              });
            }
          }

          // 4. Calcular o valor em metal e criar o lote de metal puro
          const saleDate = new Date(sale.createdAt);
          const quotation = await tx.quotation.findFirst({
            where: {
              organizationId: command.organizationId,
              metal: 'AU', // Assumindo Ouro por enquanto, conforme regra de negócio
              date: { lte: saleDate },
            },
            orderBy: { date: 'desc' },
          });

          if (!quotation) {
            throw new Error(`Cotação não encontrada para a data da venda ${sale.orderNumber}`);
          }

          const metalAmount = new Prisma.Decimal(sale.totalAmount).dividedBy(quotation.sellPrice);

          await tx.pure_metal_lots.create({
            data: {
              organizationId: command.organizationId,
              sourceType: 'SALE_CORRECTION',
              sourceId: sale.id,
              metalType: 'AU',
              initialGrams: metalAmount.toDP(4).toNumber(),
              remainingGrams: metalAmount.toDP(4).toNumber(),
              purity: 1, // Assumindo 100% por enquanto
              entryDate: sale.createdAt,
              notes: `Pagamento em metal da Venda #${sale.orderNumber}`,
            },
          });

          this.logger.log(`Lote de metal criado para a venda ${sale.orderNumber} com ${metalAmount.toDP(4)}g.`);
          results.push({ orderNumber: sale.orderNumber, status: 'SUCCESS' });
        });
      } catch (error) {
        this.logger.error(`Falha ao processar a venda ${sale.orderNumber}: ${error.message}`);
        results.push({ orderNumber: sale.orderNumber, status: 'ERROR', reason: error.message });
      }
    }

    return {
      message: `Processo de correção finalizado. ${results.filter(r => r.status === 'SUCCESS').length} de ${salesToCorrect.length} vendas corrigidas.`,
      results,
    };
  }
}
