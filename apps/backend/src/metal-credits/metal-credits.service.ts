import { Inject, Injectable } from '@nestjs/common';
import { IMetalCreditRepository, MetalCredit } from '@sistema-erp-electrosal/core';
import { MetalCreditWithUsageDto, MetalAccountEntryDto, SaleUsageDto } from './dtos/metal-credit-with-usage.dto';
import { PrismaService } from '../prisma/prisma.service'; // Import PrismaService

@Injectable()
export class MetalCreditsService {
  constructor(
    @Inject('IMetalCreditRepository')
    private readonly metalCreditRepository: IMetalCreditRepository,
    private readonly prisma: PrismaService, // Inject PrismaService
  ) {}

  async findByClientId(
    clientId: string,
    organizationId: string,
  ): Promise<MetalCreditWithUsageDto[]> {
    const metalCredits = await this.metalCreditRepository.findByClientId(clientId, organizationId);
    return this.mapMetalCreditsToDto(metalCredits, organizationId);
  }

  async findAll(organizationId: string): Promise<MetalCreditWithUsageDto[]> {
    const metalCredits = await this.metalCreditRepository.findAll(organizationId);
    return this.mapMetalCreditsToDto(metalCredits, organizationId);
  }

  async update(
    id: string,
    data: Partial<MetalCredit>,
    organizationId: string,
  ): Promise<MetalCredit> {
    return this.metalCreditRepository.update(id, data, organizationId);
  }

  private async mapMetalCreditsToDto(metalCredits: MetalCredit[], organizationId: string): Promise<MetalCreditWithUsageDto[]> {
    const metalCreditsWithUsage: MetalCreditWithUsageDto[] = [];

    for (const metalCredit of metalCredits) {
      const usageEntries: MetalAccountEntryDto[] = [];

      const client = await this.prisma.pessoa.findUnique({
        where: { id: metalCredit.clientId },
        select: { name: true },
      });
      const clientName = client?.name || 'Unknown Client';

      const metalAccount = await this.prisma.metalAccount.findUnique({
        where: {
          organizationId_personId_type: {
            organizationId,
            personId: metalCredit.clientId,
            type: metalCredit.metalType,
          },
        },
      });

      if (metalAccount) {
        const dbUsageEntries = await this.prisma.metalAccountEntry.findMany({
          where: {
            metalAccountId: metalAccount.id,
            grams: {
              lt: 0, // Less than 0 indicates a debit/usage
            },
          },
          orderBy: {
            date: 'desc',
          },
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
              where: {
                id: dbEntry.sourceId,
              },
              select: {
                id: true,
                orderNumber: true,
                createdAt: true,
                totalAmount: true,
                accountsRec: {
                  where: {
                    saleId: dbEntry.sourceId,
                  },
                  select: {
                    received: true,
                    transacoes: {
                      select: {
                        dataHora: true,
                        valor: true,
                        goldPrice: true,
                        contaCorrente: {
                          select: {
                            nome: true,
                          },
                        },
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
              where: {
                id: dbEntry.sourceId,
              },
            });

            if (debitTransaction && debitTransaction.linkedTransactionId) {
              const creditTransaction = await this.prisma.transacao.findUnique({
                where: {
                  id: debitTransaction.linkedTransactionId,
                },
                include: {
                  contaCorrente: true,
                },
              });

              if (creditTransaction) {
                paymentDate = creditTransaction.dataHora;
                paymentValueBRL = creditTransaction.valor.toNumber();
                paymentQuotation = creditTransaction.goldPrice?.toNumber();
                paymentSourceAccountName = creditTransaction.contaCorrente?.nome;
                isPaid = true; // Cash payments are always considered paid
              }
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

      metalCreditsWithUsage.push({
        id: metalCredit.id.toString(),
        clientId: metalCredit.clientId,
        chemicalAnalysisId: metalCredit.chemicalAnalysisId,
        metalType: metalCredit.metalType,
        grams: metalCredit.grams,
        date: metalCredit.date,
        organizationId: metalCredit.organizationId,
        clientName,
        usageEntries,
      });
    }

    return metalCreditsWithUsage;
  }
}