import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IRecoveryOrderRepository, RecoveryOrder, UniqueEntityID, RecoveryOrderStatus } from '@sistema-erp-electrosal/core';
import { RecoveryOrder as PrismaRecoveryOrder, RecoveryOrderStatusPrisma } from '@prisma/client';

@Injectable()
export class PrismaRecoveryOrderRepository implements IRecoveryOrderRepository {
  constructor(private prisma: PrismaService) {}

  private mapToDomain(dbData: PrismaRecoveryOrder): RecoveryOrder {
    const { id, ...props } = dbData;
    return RecoveryOrder.reconstitute(
      {
        ...props,
        status: props.status as RecoveryOrderStatus,
      },
      UniqueEntityID.create(id),
    );
  }

  async create(recoveryOrder: RecoveryOrder): Promise<RecoveryOrder> {
    const data = {
      id: recoveryOrder.id.toString(),
      organizationId: recoveryOrder.organizationId,
      chemicalAnalysisIds: recoveryOrder.chemicalAnalysisIds,
      status: recoveryOrder.status as RecoveryOrderStatusPrisma,
      dataInicio: recoveryOrder.dataInicio,
      dataFim: recoveryOrder.dataFim,
      descricaoProcesso: recoveryOrder.descricaoProcesso,
      volumeProcessado: recoveryOrder.volumeProcessado,
      unidadeProcessada: recoveryOrder.unidadeProcessada,
      resultadoFinal: recoveryOrder.resultadoFinal,
      unidadeResultado: recoveryOrder.unidadeResultado,
      observacoes: recoveryOrder.observacoes,
      dataCriacao: recoveryOrder.dataCriacao,
      dataAtualizacao: recoveryOrder.dataAtualizacao,
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
    return dbRecoveryOrder ? this.mapToDomain(dbRecoveryOrder) : null;
  }

  async findAll(organizationId: string): Promise<RecoveryOrder[]> {
    const dbRecoveryOrders = await this.prisma.recoveryOrder.findMany({
      where: {
        organizationId,
      },
      orderBy: { dataCriacao: 'desc' },
    });
    return dbRecoveryOrders.map(this.mapToDomain);
  }

  async save(recoveryOrder: RecoveryOrder): Promise<RecoveryOrder> {
    const data = {
      organizationId: recoveryOrder.organizationId,
      chemicalAnalysisIds: recoveryOrder.chemicalAnalysisIds,
      status: recoveryOrder.status as RecoveryOrderStatusPrisma,
      dataInicio: recoveryOrder.dataInicio,
      dataFim: recoveryOrder.dataFim,
      descricaoProcesso: recoveryOrder.descricaoProcesso,
      volumeProcessado: recoveryOrder.volumeProcessado,
      unidadeProcessada: recoveryOrder.unidadeProcessada,
      resultadoFinal: recoveryOrder.resultadoFinal,
      unidadeResultado: recoveryOrder.unidadeResultado,
      observacoes: recoveryOrder.observacoes,
      dataCriacao: recoveryOrder.dataCriacao,
      dataAtualizacao: recoveryOrder.dataAtualizacao,
    };

    const dbRecoveryOrder = await this.prisma.recoveryOrder.update({
      where: { id: recoveryOrder.id.toString() },
      data,
    });
    return this.mapToDomain(dbRecoveryOrder);
  }
}