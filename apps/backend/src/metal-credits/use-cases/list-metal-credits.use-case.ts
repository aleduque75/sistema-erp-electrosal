import { Injectable } from '@nestjs/common';
import { MetalCreditsRepository } from '../repositories/metal-credit.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { MetalCreditEntity } from '../entities/metal-credit.entity';
import { MetalCreditMapper } from '../mappers/metal-credit.mapper';
import { MetalCreditWithUsageDto, MetalAccountEntryDto, SaleUsageDto } from '../dtos/metal-credit-with-usage.dto';

@Injectable()
export class ListMetalCreditsUseCase {
  constructor(
    private readonly metalCreditsRepository: MetalCreditsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(organizationId: string, clientId?: string): Promise<MetalCreditWithUsageDto[]> {
    const credits = clientId
      ? await this.metalCreditsRepository.findByClientId(clientId, organizationId)
      : await this.metalCreditsRepository.findAll(organizationId);

    return this.enrichCredits(credits, organizationId);
  }

  private async enrichCredits(
    metalCredits: MetalCreditEntity[],
    organizationId: string,
  ): Promise<MetalCreditWithUsageDto[]> {
    const result: MetalCreditWithUsageDto[] = [];

    for (const credit of metalCredits) {
      const usageEntries: MetalAccountEntryDto[] = [];

      const client = await this.prisma.pessoa.findUnique({
        where: { id: credit.clientId },
        select: { name: true },
      });
      const clientName = client?.name || 'Unknown Client';

      const metalAccount = await this.prisma.metalAccount.findUnique({
        where: {
          organizationId_personId_type: {
            organizationId,
            personId: credit.clientId,
            type: credit.metalType,
          },
        },
      });

      if (metalAccount) {
        const dbUsageEntries = await this.prisma.metalAccountEntry.findMany({
          where: {
            metalAccountId: metalAccount.id,
            grams: { lt: 0 },
          },
          orderBy: { date: 'desc' },
        });

        for (const dbEntry of dbUsageEntries) {
          let saleUsage: SaleUsageDto | undefined;
          let paymentDate: Date | undefined;
          let paymentValueBRL: number | undefined;
          let paymentQuotation: number | undefined;
          let paymentSourceAccountName: string | undefined;
          let isPaid: boolean | undefined;

          if (dbEntry.type === 'SALE_PAYMENT' && dbEntry.sourceId) {
            const sale = await this.prisma.sale.findUnique({
              where: { id: dbEntry.sourceId },
              select: {
                id: true,
                orderNumber: true,
                createdAt: true,
                totalAmount: true,
                accountsRec: {
                  where: { saleId: dbEntry.sourceId },
                  select: {
                    received: true,
                    transacoes: {
                      select: {
                        dataHora: true,
                        valor: true,
                        goldPrice: true,
                        contaCorrente: { select: { nome: true } },
                      },
                      take: 1,
                    },
                  },
                  take: 1,
                },
              },
            });

            if (sale) {
              saleUsage = {
                id: sale.id,
                orderNumber: sale.orderNumber,
                saleDate: sale.createdAt,
                totalAmount: sale.totalAmount.toNumber(),
              };

              if (sale.accountsRec && sale.accountsRec.length > 0) {
                const accountRec = sale.accountsRec[0];
                isPaid = accountRec.received;
                if (accountRec.transacoes && accountRec.transacoes.length > 0) {
                  const transaction = accountRec.transacoes[0];
                  paymentDate = transaction.dataHora;
                  paymentValueBRL = transaction.valor.toNumber();
                  paymentQuotation = transaction.goldPrice?.toNumber();
                  paymentSourceAccountName = transaction.contaCorrente?.nome;
                }
              }
            }
          } else if (dbEntry.type === 'CASH_PAYMENT' && dbEntry.sourceId) {
            const debitTransaction = await this.prisma.transacao.findUnique({
              where: { id: dbEntry.sourceId },
            });

            if (debitTransaction && debitTransaction.linkedTransactionId) {
              const creditTransaction = await this.prisma.transacao.findUnique({
                where: { id: debitTransaction.linkedTransactionId },
                include: { contaCorrente: true },
              });

              if (creditTransaction) {
                paymentDate = creditTransaction.dataHora;
                paymentValueBRL = creditTransaction.valor.toNumber();
                paymentQuotation = creditTransaction.goldPrice?.toNumber();
                paymentSourceAccountName = creditTransaction.contaCorrente?.nome;
                isPaid = true;
              }
            }
          } else if (dbEntry.type === 'DEBIT' && dbEntry.sourceId) {
            const movement = await this.prisma.pureMetalLotMovement.findUnique({
              where: { id: dbEntry.sourceId },
              include: { pureMetalLot: true },
            });
            if (movement?.pureMetalLot) {
              paymentSourceAccountName = `Lote: ${movement.pureMetalLot.lotNumber || movement.pureMetalLot.id}`;
            }
          }

          usageEntries.push({
            id: dbEntry.id,
            date: dbEntry.date,
            description: dbEntry.description,
            grams: dbEntry.grams.toNumber(),
            type: dbEntry.type,
            sourceId: dbEntry.sourceId || undefined,
            sale: saleUsage,
            paymentDate,
            paymentValueBRL,
            paymentQuotation,
            paymentSourceAccountName,
            isPaid,
          });
        }
      }

      result.push(
        MetalCreditMapper.toResponseDto(credit, {
          clientName,
          usageEntries,
        }),
      );
    }

    return result;
  }
}
