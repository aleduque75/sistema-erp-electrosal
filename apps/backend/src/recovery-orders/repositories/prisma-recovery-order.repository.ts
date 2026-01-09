import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IRecoveryOrderRepository, RecoveryOrder, UniqueEntityID, RecoveryOrderStatus, AnaliseQuimicaResumida } from '@sistema-erp-electrosal/core';
import { RecoveryOrder as PrismaRecoveryOrder, RecoveryOrderStatusPrisma, Prisma, RawMaterial as PrismaRawMaterial, RawMaterialUsed as PrismaRawMaterialUsed, Media } from '@prisma/client';
import { MediaMapper } from '../../media/mappers/media.mapper';
import { ListRecoveryOrdersDto } from '../dtos/list-recovery-orders.dto';

@Injectable()
export class PrismaRecoveryOrderRepository implements IRecoveryOrderRepository {
  constructor(private prisma: PrismaService) {}

  private mapToDomain(
    dbData: PrismaRecoveryOrder & {
      rawMaterialsUsed?: (PrismaRawMaterialUsed & { rawMaterial: PrismaRawMaterial })[];
      images?: Media[];
      salesperson?: { name: string } | null;
    },
    analisesEnvolvidas?: AnaliseQuimicaResumida[]
  ): RecoveryOrder {
    const { id, ...props } = dbData;
    const domainRecoveryOrder = RecoveryOrder.reconstitute(
      {
        organizationId: props.organizationId,
        orderNumber: props.orderNumber,
        metalType: props.metalType,
        chemicalAnalysisIds: props.chemicalAnalysisIds,
        status: props.status as RecoveryOrderStatus,
        dataInicio: props.dataInicio,
        dataFim: props.dataFim ?? undefined,
        descricao: props.descricao ?? undefined,
        observacoes: props.observacoes ?? undefined,
        dataCriacao: props.dataCriacao,
        dataAtualizacao: props.dataAtualizacao,
        totalBrutoEstimadoGramas: props.totalBrutoEstimadoGramas,
        resultadoProcessamentoGramas: props.resultadoProcessamentoGramas ?? undefined,
        teorFinal: props.teorFinal ?? undefined,
        auPuroRecuperadoGramas: props.auPuroRecuperadoGramas ?? undefined,
        residuoGramas: props.residuoGramas ?? undefined,
        residueAnalysisId: props.residueAnalysisId ?? undefined,
        salespersonId: props.salespersonId ?? undefined,
        commissionPercentage: props.commissionPercentage ? props.commissionPercentage.toNumber() : undefined,
        commissionAmount: props.commissionAmount ? props.commissionAmount.toNumber() : undefined,
        images: props.images ? props.images.map(MediaMapper.toDomain) : [],
      },
      UniqueEntityID.create(id),
    );

    // Adiciona o nome do vendedor ao objeto de domínio (usando cast pois não está na entidade do core)
    (domainRecoveryOrder as any).salespersonName = dbData.salesperson?.name || null;

    if (analisesEnvolvidas) {
      domainRecoveryOrder.setAnalisesEnvolvidas(analisesEnvolvidas);
    }

    if (dbData.rawMaterialsUsed !== undefined) {
      domainRecoveryOrder.setRawMaterialsUsed(dbData.rawMaterialsUsed.map(rmu => ({
        id: rmu.id,
        rawMaterialId: rmu.rawMaterialId,
        rawMaterialName: rmu.rawMaterial.name,
        quantity: rmu.quantity,
        cost: rmu.cost.toNumber(),
        unit: rmu.rawMaterial.unit,
        goldEquivalentCost: rmu.goldEquivalentCost?.toNumber() || null,
      })));
    } else {
      domainRecoveryOrder.setRawMaterialsUsed([]);
    }

    return domainRecoveryOrder;
  }

  async create(recoveryOrder: RecoveryOrder, tx?: Prisma.TransactionClient): Promise<RecoveryOrder> {
    const prisma = tx || this.prisma;
    const data = {
      id: recoveryOrder.id.toString(),
      organizationId: recoveryOrder.organizationId,
      orderNumber: recoveryOrder.orderNumber,
      metalType: recoveryOrder.metalType,
      chemicalAnalysisIds: recoveryOrder.chemicalAnalysisIds,
      status: recoveryOrder.status as RecoveryOrderStatusPrisma,
      dataInicio: recoveryOrder.dataInicio,
      dataFim: recoveryOrder.dataFim,
      descricao: recoveryOrder.descricao,
      observacoes: recoveryOrder.observacoes,
      dataCriacao: recoveryOrder.dataCriacao,
      dataAtualizacao: recoveryOrder.dataAtualizacao,
      totalBrutoEstimadoGramas: recoveryOrder.totalBrutoEstimadoGramas,
      salespersonId: recoveryOrder.salespersonId,
      commissionPercentage: recoveryOrder.commissionPercentage,
      commissionAmount: recoveryOrder.commissionAmount,
    };

    const dbRecoveryOrder = await prisma.recoveryOrder.create({ data });
    return this.mapToDomain(dbRecoveryOrder);
  }

  async findByOrderNumber(orderNumber: string, organizationId: string): Promise<RecoveryOrder | null> {
    const dbRecoveryOrder = await this.prisma.recoveryOrder.findFirst({
      where: {
        orderNumber,
        organizationId,
      },
      include: {
        salesperson: { select: { name: true } },
        rawMaterialsUsed: {
          include: {
            rawMaterial: true,
          },
        },
      },
    });

    if (!dbRecoveryOrder) {
      return null;
    }

    const analisesEnvolvidas = await this.prisma.analiseQuimica.findMany({
      where: {
        id: { in: dbRecoveryOrder.chemicalAnalysisIds },
        organizationId: dbRecoveryOrder.organizationId,
      },
      select: {
        id: true,
        numeroAnalise: true,
        metalType: true,
        volumeOuPesoEntrada: true,
        resultadoAnaliseValor: true,
        auEstimadoBrutoGramas: true,
        auLiquidoParaClienteGramas: true,
        cliente: {
          select: {
            name: true,
          },
        },
        metalCredit: {
          select: {
            grams: true,
          },
        },
      },
    });

    const mappedAnalises: AnaliseQuimicaResumida[] = analisesEnvolvidas.map(analise => ({
      id: analise.id,
      numeroAnalise: analise.numeroAnalise,
      clienteName: analise.cliente?.name || 'N/A',
      metalType: analise.metalType,
      volumeOuPesoEntrada: analise.volumeOuPesoEntrada,
      resultadoAnaliseValor: analise.resultadoAnaliseValor,
      auEstimadoBrutoGramas: analise.auEstimadoBrutoGramas,
      auLiquidoParaClienteGramas: analise.auLiquidoParaClienteGramas,
      metalCreditGrams: analise.metalCredit?.grams.toNumber() || null,
    }));

    return this.mapToDomain(dbRecoveryOrder, mappedAnalises);
  }

  async findById(id: string, organizationId: string): Promise<RecoveryOrder | null> {
    const dbRecoveryOrder = await this.prisma.recoveryOrder.findFirst({
      include: {
        salesperson: { select: { name: true } },
        rawMaterialsUsed: {
          include: {
            rawMaterial: true,
          },
        },
        images: true,
      },
    });

    if (!dbRecoveryOrder) {
      return null;
    }

    const analisesEnvolvidas = await this.prisma.analiseQuimica.findMany({
      where: {
        id: { in: dbRecoveryOrder.chemicalAnalysisIds },
        organizationId: dbRecoveryOrder.organizationId,
      },
      select: {
        id: true,
        numeroAnalise: true,
        metalType: true,
        volumeOuPesoEntrada: true,
        resultadoAnaliseValor: true,
        auEstimadoBrutoGramas: true,
        auLiquidoParaClienteGramas: true,
        cliente: {
          select: {
            name: true,
          },
        },
        metalCredit: {
          select: {
            grams: true,
          },
        },
      },
    });

    const mappedAnalises: AnaliseQuimicaResumida[] = analisesEnvolvidas.map(analise => ({
      id: analise.id,
      numeroAnalise: analise.numeroAnalise,
      clienteName: analise.cliente?.name || 'N/A',
      metalType: analise.metalType,
      volumeOuPesoEntrada: analise.volumeOuPesoEntrada,
      resultadoAnaliseValor: analise.resultadoAnaliseValor,
      auEstimadoBrutoGramas: analise.auEstimadoBrutoGramas,
      auLiquidoParaClienteGramas: analise.auLiquidoParaClienteGramas,
      metalCreditGrams: analise.metalCredit?.grams.toNumber() || null,
    }));

    return this.mapToDomain(dbRecoveryOrder, mappedAnalises);
  }

  async findAll(organizationId: string, filters?: ListRecoveryOrdersDto): Promise<RecoveryOrder[]> {
    const whereClause: Prisma.RecoveryOrderWhereInput = { organizationId };

    if (filters?.metalType) {
      whereClause.metalType = filters.metalType;
    }
    if (filters?.startDate) {
      whereClause.dataInicio = { gte: new Date(filters.startDate) };
    }
    if (filters?.endDate) {
      if (!whereClause.dataInicio) {
        whereClause.dataInicio = {};
      }
      (whereClause.dataInicio as Prisma.DateTimeFilter).lte = new Date(filters.endDate);
    }
    if (filters?.orderNumber) {
      whereClause.orderNumber = filters.orderNumber;
    }

    const dbRecoveryOrders = await this.prisma.recoveryOrder.findMany({
      where: whereClause,
      include: {
        salesperson: { select: { name: true } },
        rawMaterialsUsed: {
          include: {
            rawMaterial: true,
          },
        },
        images: true,
      },
      orderBy: { dataCriacao: 'desc' },
    });


    const recoveryOrdersWithAnalyses: RecoveryOrder[] = [];

    for (const dbRecoveryOrder of dbRecoveryOrders) {
      const analisesEnvolvidas = await this.prisma.analiseQuimica.findMany({
        where: {
          id: { in: dbRecoveryOrder.chemicalAnalysisIds },
          organizationId: dbRecoveryOrder.organizationId,
        },
        select: {
          id: true,
          numeroAnalise: true,
          metalType: true,
          volumeOuPesoEntrada: true,
          resultadoAnaliseValor: true,
          auEstimadoBrutoGramas: true,
          auLiquidoParaClienteGramas: true,
          cliente: {
            select: {
              name: true,
            },
          },
          metalCredit: {
            select: {
              grams: true,
            },
          },
        },
      });

      const mappedAnalises: AnaliseQuimicaResumida[] = analisesEnvolvidas.map(analise => ({
        id: analise.id,
        numeroAnalise: analise.numeroAnalise,
        clienteName: analise.cliente?.name || 'N/A',
        metalType: analise.metalType,
        volumeOuPesoEntrada: analise.volumeOuPesoEntrada,
        resultadoAnaliseValor: analise.resultadoAnaliseValor,
        auEstimadoBrutoGramas: analise.auEstimadoBrutoGramas,
        auLiquidoParaClienteGramas: analise.auLiquidoParaClienteGramas,
        metalCreditGrams: analise.metalCredit?.grams.toNumber() || null,
      }));

      recoveryOrdersWithAnalyses.push(this.mapToDomain(dbRecoveryOrder, mappedAnalises));
    }

    return recoveryOrdersWithAnalyses;
  }

  async save(recoveryOrder: RecoveryOrder, tx?: Prisma.TransactionClient): Promise<RecoveryOrder> {
    const prisma = tx || this.prisma;
    const data = {
      status: recoveryOrder.status as RecoveryOrderStatusPrisma,
      dataFim: recoveryOrder.dataFim,
      descricao: recoveryOrder.descricao,
      observacoes: recoveryOrder.observacoes,
      dataAtualizacao: recoveryOrder.dataAtualizacao,
      resultadoProcessamentoGramas: recoveryOrder.resultadoProcessamentoGramas,
      teorFinal: recoveryOrder.teorFinal,
      auPuroRecuperadoGramas: recoveryOrder.auPuroRecuperadoGramas,
      residuoGramas: recoveryOrder.residuoGramas,
      residueAnalysisId: recoveryOrder.residueAnalysisId,
      salespersonId: recoveryOrder.salespersonId,
      commissionPercentage: recoveryOrder.commissionPercentage,
      commissionAmount: recoveryOrder.commissionAmount,
    };

    const dbRecoveryOrder = await prisma.recoveryOrder.update({
      where: { id: recoveryOrder.id.toString() },
      data,
      include: {
        salesperson: { select: { name: true } },
        images: true,
      },
    });
    return this.mapToDomain(dbRecoveryOrder);
  }
}
