import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChemicalAnalysesRepository, ChemicalAnalysesFilters } from './chemical-analyses.repository';
import { ChemicalAnalysisEntity } from '../entities/chemical-analysis.entity';
import { ChemicalAnalysisMapper } from '../mappers/chemical-analysis.mapper';
import { Prisma, StatusAnaliseQuimicaPrisma } from '@prisma/client';
import {
  AnaliseQuimica,
  IAnaliseQuimicaRepository,
  FiltrosAnaliseQuimica,
  UniqueEntityID,
} from '@sistema-erp-electrosal/core';

@Injectable()
export class PrismaChemicalAnalysesRepository
  extends ChemicalAnalysesRepository
  implements IAnaliseQuimicaRepository
{
  private readonly logger = new Logger(PrismaChemicalAnalysesRepository.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private getClient(tx?: any) {
    return tx || this.prisma;
  }

  async create(entity: ChemicalAnalysisEntity | any, txOrOrgId?: any, maybeTx?: any): Promise<ChemicalAnalysisEntity> {
    const tx = maybeTx || (typeof txOrOrgId === 'object' && txOrOrgId !== null ? txOrOrgId : undefined);
    const orgId = typeof txOrOrgId === 'string' ? txOrOrgId : undefined;
    const data = ChemicalAnalysisMapper.toPersistence(entity, orgId);
    if (!data.organizationId && orgId) {
      data.organizationId = orgId;
    }
    const created = await this.getClient(tx).analiseQuimica.create({ data });
    return ChemicalAnalysisMapper.toDomain(created);
  }

  async save(entity: ChemicalAnalysisEntity | any, txOrOrgId?: any, maybeTx?: any): Promise<ChemicalAnalysisEntity> {
    const tx = maybeTx || (typeof txOrOrgId === 'object' && txOrOrgId !== null ? txOrOrgId : undefined);
    const orgId = typeof txOrOrgId === 'string' ? txOrOrgId : undefined;
    const id = entity.id?.toString ? entity.id.toString() : entity.id;
    if (!id) {
      throw new Error('Não é possível salvar uma análise sem ID.');
    }
    const data = ChemicalAnalysisMapper.toPersistence(entity, orgId);
    if (!data.organizationId && orgId) {
      data.organizationId = orgId;
    }
    const updated = await this.getClient(tx).analiseQuimica.update({
      where: { id },
      data,
    });
    return ChemicalAnalysisMapper.toDomain(updated);
  }

  async findById(id: string, organizationId: string, tx?: any): Promise<ChemicalAnalysisEntity | null> {
    const raw = await this.getClient(tx).analiseQuimica.findFirst({
      where: { id, organizationId },
    });
    if (!raw) return null;
    return ChemicalAnalysisMapper.toDomain(raw);
  }

  async findByIdWithDetails(id: string, organizationId: string, tx?: any): Promise<any | null> {
    const raw = await this.getClient(tx).analiseQuimica.findFirst({
      where: { id, organizationId },
      include: {
        cliente: {
          select: {
            id: true,
            name: true,
          },
        },
        recoveryOrderAsResidue: {
          select: {
            id: true,
          },
        },
        metalCredit: true,
        media: true,
      },
    });
    if (!raw) return null;
    const entity = ChemicalAnalysisMapper.toDomain(raw);
    return ChemicalAnalysisMapper.toResponseDto(entity, {
      cliente: raw.cliente,
      clientName: raw.cliente?.name,
      metalCredit: raw.metalCredit,
      media: raw.media,
      recoveryOrderAsResidue: raw.recoveryOrderAsResidue,
    });
  }

  async findByNumeroAnalise(
    numeroAnalise: string,
    organizationId: string,
    tx?: any,
  ): Promise<ChemicalAnalysisEntity | null> {
    const raw = await this.getClient(tx).analiseQuimica.findFirst({
      where: { numeroAnalise, organizationId },
    });
    if (!raw) return null;
    return ChemicalAnalysisMapper.toDomain(raw);
  }

  async findAll(organizationId: string, filters?: ChemicalAnalysesFilters, tx?: any): Promise<any[]> {
    const where: Prisma.AnaliseQuimicaWhereInput = { organizationId };

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status as StatusAnaliseQuimicaPrisma[] };
      } else {
        where.status = filters.status as StatusAnaliseQuimicaPrisma;
      }
    }

    if (filters?.clienteId) {
      where.clienteId = filters.clienteId;
    }

    if (filters?.metalType) {
      where.metalType = filters.metalType as any;
    }

    if (filters?.numeroAnalise) {
      where.numeroAnalise = { contains: filters.numeroAnalise, mode: 'insensitive' };
    }

    const start = filters?.dataInicio || filters?.startDate;
    const end = filters?.dataFim || filters?.endDate;

    if (start || end) {
      where.dataEntrada = {
        ...(start ? { gte: new Date(start) } : {}),
        ...(end ? { lte: new Date(end) } : {}),
      };
    }

    const items = await this.getClient(tx).analiseQuimica.findMany({
      where,
      include: {
        cliente: {
          select: {
            name: true,
          },
        },
        recoveryOrderAsResidue: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { dataEntrada: 'desc' },
    });

    return items.map((raw) => {
      const entity = ChemicalAnalysisMapper.toDomain(raw);
      return ChemicalAnalysisMapper.toResponseDto(entity, {
        clientName: raw.cliente?.name,
        cliente: raw.cliente,
        recoveryOrderAsResidue: raw.recoveryOrderAsResidue,
      });
    });
  }

  async findAnalisesAprovadasSemOrdem(organizationId: string, clienteId?: string, tx?: any): Promise<any[]> {
    const where: Prisma.AnaliseQuimicaWhereInput = {
      organizationId,
      status: StatusAnaliseQuimicaPrisma.APROVADO_PARA_RECUPERACAO,
      ordemDeRecuperacaoId: null,
      isWriteOff: false,
    };

    if (clienteId) {
      where.clienteId = clienteId;
    }

    const items = await this.getClient(tx).analiseQuimica.findMany({
      where,
      include: {
        cliente: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { dataEntrada: 'desc' },
    });

    return items.map((raw) => {
      const entity = ChemicalAnalysisMapper.toDomain(raw);
      return ChemicalAnalysisMapper.toResponseDto(entity, {
        clientName: raw.cliente?.name,
        cliente: raw.cliente,
      });
    });
  }

  async delete(id: string, organizationId: string, tx?: any): Promise<void> {
    await this.getClient(tx).analiseQuimica.delete({
      where: { id, organizationId },
    });
  }

  async getNextCrrNumber(organizationId: string, tx?: any): Promise<string> {
    const client = this.getClient(tx);
    const counter = await client.crrCounter.upsert({
      where: { organizationId },
      update: { lastCrrNumber: { increment: 1 } },
      create: { organizationId, lastCrrNumber: 3066 },
    });
    return `CRR-${counter.lastCrrNumber}`;
  }

  async executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  // --- Implementação de compatibilidade com IAnaliseQuimicaRepository (Core) ---
  async findAllByClienteId(clienteId: string): Promise<AnaliseQuimica[]> {
    const records = await this.prisma.analiseQuimica.findMany({
      where: { clienteId },
      include: { cliente: { select: { name: true } } },
    });
    return records
      .map((r) => this.mapLegacyDomain(r))
      .filter((a): a is AnaliseQuimica => a !== null);
  }

  private mapLegacyDomain(dbData: any): AnaliseQuimica | null {
    if (!dbData) return null;
    const { id, cliente, ...props } = dbData;
    return AnaliseQuimica.reconstituir(
      {
        ...props,
        cliente: cliente || undefined,
        recoveryOrderAsResidue: dbData.recoveryOrderAsResidue,
      } as any,
      UniqueEntityID.create(id),
    );
  }
}
