import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IRecoveryOrderRepository, RecoveryOrder, UniqueEntityID, RecoveryOrderStatus, AnaliseQuimicaResumida } from '@sistema-erp-electrosal/core';
import { RecoveryOrder as PrismaRecoveryOrder, RecoveryOrderStatusPrisma, Prisma } from '@prisma/client';
import { ListRecoveryOrdersDto } from '../dtos/list-recovery-orders.dto';

@Injectable()
export class PrismaRecoveryOrderRepository implements IRecoveryOrderRepository {
  constructor(private prisma: PrismaService) {}

  private mapToDomain(dbData: PrismaRecoveryOrder, analisesEnvolvidas?: AnaliseQuimicaResumida[]): RecoveryOrder {
    const { id, ...props } = dbData;
    const domainRecoveryOrder = RecoveryOrder.reconstitute(
      {
        organizationId: props.organizationId,
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
      },
      UniqueEntityID.create(id),
    );

    if (analisesEnvolvidas) {
      domainRecoveryOrder.setAnalisesEnvolvidas(analisesEnvolvidas);
    }

    return domainRecoveryOrder;
  }

  async create(recoveryOrder: RecoveryOrder): Promise<RecoveryOrder> {
    const data = {
      id: recoveryOrder.id.toString(),
      organizationId: recoveryOrder.organizationId,
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
    };

    const dbRecoveryOrder = await this.prisma.recoveryOrder.create({ data });
    return this.mapToDomain(dbRecoveryOrder);
  }

  async findById(id: string, organizationId: string): Promise<RecoveryOrder | null> {
    const dbRecoveryOrder = await this.prisma.recoveryOrder.findFirst({
      where: {
        id,
        organizationId,
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
        volumeOuPesoEntrada: true,
        cliente: {
          select: {
            name: true,
          },
        },
      },
    });

    const mappedAnalises: AnaliseQuimicaResumida[] = analisesEnvolvidas.map(analise => ({
      id: analise.id,
      numeroAnalise: analise.numeroAnalise,
      clienteName: analise.cliente?.name || 'N/A',
      volumeOuPesoEntrada: analise.volumeOuPesoEntrada,
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

    const dbRecoveryOrders = await this.prisma.recoveryOrder.findMany({
      where: whereClause,
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
          volumeOuPesoEntrada: true,
          cliente: {
            select: {
              name: true,
            },
          },
        },
      });

      const mappedAnalises: AnaliseQuimicaResumida[] = analisesEnvolvidas.map(analise => ({
        id: analise.id,
        numeroAnalise: analise.numeroAnalise,
        clienteName: analise.cliente?.name || 'N/A',
        volumeOuPesoEntrada: analise.volumeOuPesoEntrada,
      }));

      recoveryOrdersWithAnalyses.push(this.mapToDomain(dbRecoveryOrder, mappedAnalises));
    }

    return recoveryOrdersWithAnalyses;
  }

  async save(recoveryOrder: RecoveryOrder): Promise<RecoveryOrder> {
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
    };

    const dbRecoveryOrder = await this.prisma.recoveryOrder.update({
      where: { id: recoveryOrder.id.toString() },
      data,
    });
    return this.mapToDomain(dbRecoveryOrder);
  }
}
