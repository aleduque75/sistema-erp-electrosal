import { Injectable, Logger } from '@nestjs/common';
import { MetalCreditsRepository } from '../repositories/metal-credit.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { MetalCreditEntity } from '../entities/metal-credit.entity';
import { MetalCreditMapper } from '../mappers/metal-credit.mapper';
import { MetalCreditWithUsageDto, MetalAccountEntryDto, SaleUsageDto } from '../dtos/metal-credit-with-usage.dto';
import { filterEntriesForCredit, enrichUsageEntry } from '../utils/metal-credit-usage.helper';

@Injectable()
export class ListMetalCreditsUseCase {
  private readonly logger = new Logger(ListMetalCreditsUseCase.name);

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

      try {
        const client = credit.clientId
          ? await this.prisma.pessoa.findUnique({
              where: { id: credit.clientId },
              select: { name: true },
            })
          : null;
        const clientName = client?.name || 'Unknown Client';

        const chemicalAnalysis = credit.chemicalAnalysisId
          ? await this.prisma.analiseQuimica.findUnique({
              where: { id: credit.chemicalAnalysisId },
              select: {
                id: true,
                numeroAnalise: true,
                descricaoMaterial: true,
                dataEntrada: true,
                volumeOuPesoEntrada: true,
                unidadeEntrada: true,
                resultadoAnaliseValor: true,
                unidadeResultado: true,
                auLiquidoParaClienteGramas: true,
                teorRecuperavel: true,
                status: true,
                observacoes: true,
                dataCriacao: true,
              },
            })
          : null;

        const metalAccount = credit.clientId
          ? await this.prisma.metalAccount.findUnique({
              where: {
                organizationId_personId_type: {
                  organizationId,
                  personId: credit.clientId,
                  type: credit.metalType,
                },
              },
            })
          : null;

        if (metalAccount && Number(credit.settledGramsNumber || 0) > 0.0001) {
          const allNegativeEntries = await this.prisma.metalAccountEntry.findMany({
            where: {
              metalAccountId: metalAccount.id,
              grams: { lt: 0 },
            },
            orderBy: { date: 'desc' },
          });

          const txIds = allNegativeEntries
            .filter((e) => e.type === 'CASH_PAYMENT' || e.type === 'CLIENT_CREDIT_PAYMENT')
            .map((e) => e.sourceId)
            .filter((id): id is string => !!id);

          const txMap = new Map<string, string>();
          if (txIds.length > 0) {
            const transactions = await this.prisma.transacao.findMany({
              where: { id: { in: txIds } },
              select: { id: true, descricao: true },
            });
            transactions.forEach((t) => txMap.set(t.id, t.descricao || ''));
          }

          const dbUsageEntries = filterEntriesForCredit(
            {
              id: credit.id,
              clientId: credit.clientId,
              metalType: credit.metalType,
              grams: credit.gramsNumber,
              settledGrams: credit.settledGramsNumber,
              date: credit.date,
              createdAt: credit.createdAt,
              chemicalAnalysisId: credit.chemicalAnalysisId,
              chemicalAnalysis,
            },
            allNegativeEntries,
            txMap,
          );

          for (const dbEntry of dbUsageEntries) {
            try {
              const enrichedEntry = await enrichUsageEntry(this.prisma, dbEntry);
              usageEntries.push(enrichedEntry);
            } catch (entryErr) {
              this.logger.warn(`Erro ao processar entrada de uso ${dbEntry.id}:`, entryErr);
            }
          }
        }

        result.push(
          MetalCreditMapper.toResponseDto(credit, {
            clientName,
            chemicalAnalysis,
            usageEntries,
          }),
        );
      } catch (creditErr) {
        this.logger.error(`Erro ao enriquecer crédito de metal ${credit.id}:`, creditErr);
        result.push(
          MetalCreditMapper.toResponseDto(credit, {
            clientName: 'Unknown Client',
            usageEntries: [],
          }),
        );
      }
    }

    return result;
  }
}
