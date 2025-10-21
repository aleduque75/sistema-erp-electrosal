import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AnaliseQuimica,
  IAnaliseQuimicaRepository,
  AnaliseQuimicaProps,
  FiltrosAnaliseQuimica,
  UniqueEntityID,
} from '@sistema-erp-electrosal/core';
import {
  AnaliseQuimica as PrismaAnalise,
  Prisma,
  StatusAnaliseQuimicaPrisma,
} from '@prisma/client';

@Injectable()
export class PrismaAnaliseQuimicaRepository implements IAnaliseQuimicaRepository {
  private readonly logger = new Logger(PrismaAnaliseQuimicaRepository.name);

  constructor(private prisma: PrismaService) {}

  private mapToDomain(
    dbData: (PrismaAnalise & { cliente?: { name: string } | null }) | null,
  ): AnaliseQuimica | null {
    if (!dbData) return null;
    const { id, cliente, ...props } = dbData;
    const domainAnalise = AnaliseQuimica.reconstituir(
      {
        ...props,
        cliente: cliente || undefined,
      } as any,
      UniqueEntityID.create(id),
    );

    return domainAnalise;
  }

  public mapToPrismaPayload(
    analise: AnaliseQuimica,
    organizationId: string,
  ): Prisma.AnaliseQuimicaUncheckedCreateInput {
    this.logger.log(`analise.clienteId no mapToPrismaPayload: ${analise.clienteId}`);
    return {
      id: analise.id.toString(),
      organizationId,
      metalType: analise.metalType,
      clienteId: analise.clienteId || null,
      numeroAnalise: analise.numeroAnalise,
      dataEntrada: analise.dataEntrada,
      descricaoMaterial: analise.descricaoMaterial,
      volumeOuPesoEntrada: analise.volumeOuPesoEntrada,
      unidadeEntrada: analise.unidadeEntrada,
      status: analise.status as StatusAnaliseQuimicaPrisma,
      resultadoAnaliseValor: analise.resultadoAnaliseValor,
      unidadeResultado: analise.unidadeResultado,
      percentualQuebra: analise.percentualQuebra,
      taxaServicoPercentual: analise.taxaServicoPercentual,
      teorRecuperavel: analise.teorRecuperavel,
      auEstimadoBrutoGramas: analise.auEstimadoBrutoGramas,
      auEstimadoRecuperavelGramas: analise.auEstimadoRecuperavelGramas,
      taxaServicoEmGramas: analise.taxaServicoEmGramas,
      auLiquidoParaClienteGramas: analise.auLiquidoParaClienteGramas,
      dataAnaliseConcluida: analise.dataAnaliseConcluida,
      dataAprovacaoCliente: analise.dataAprovacaoCliente,
      dataFinalizacaoRecuperacao: analise.dataFinalizacaoRecuperacao,
      observacoes: analise.observacoes,
      ordemDeRecuperacaoId: analise.ordemDeRecuperacaoId,
    };
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<AnaliseQuimica | null> {
    const dbAnalise = await this.prisma.analiseQuimica.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        cliente: {
          select: {
            name: true,
          },
        },
      },
    });
    return this.mapToDomain(dbAnalise);
  }

  async findByNumeroAnalise(
    numeroAnalise: string,
    organizationId: string,
  ): Promise<AnaliseQuimica | null> {
    return this.mapToDomain(
      await this.prisma.analiseQuimica.findUnique({
        where: {
          organizationId_numeroAnalise: {
            organizationId,
            numeroAnalise,
          },
        },
      }),
    );
  }

  async findLastNumeroAnalise(organizationId: string): Promise<string | null> {
    const lastAnalise = await this.prisma.analiseQuimica.findFirst({
      where: {
        organizationId,
        numeroAnalise: {
          startsWith: 'AQ-',
        },
      },
      orderBy: {
        dataCriacao: 'desc',
      },
      select: {
        numeroAnalise: true,
      },
    });

    return lastAnalise?.numeroAnalise || null;
  }

  async findAllByClienteId(clienteId: string): Promise<AnaliseQuimica[]> {
    return this.findAll({ clienteId });
  }

  async findAnalisesAprovadasSemOrdem(
    organizationId: string,
    clienteId?: string,
  ): Promise<AnaliseQuimica[]> {
    const whereClause: Prisma.AnaliseQuimicaWhereInput = {
      status: StatusAnaliseQuimicaPrisma.APROVADO_PARA_RECUPERACAO,
      ordemDeRecuperacaoId: null,
      organizationId,
    };
    if (clienteId) {
      whereClause.clienteId = clienteId;
    }
    const dbAnalises = await this.prisma.analiseQuimica.findMany({
      where: whereClause,
      orderBy: { dataEntrada: 'asc' },
    });
    return dbAnalises
      .map((db) => this.mapToDomain(db))
      .filter((a): a is AnaliseQuimica => a !== null);
  }

  async findAll(filtros?: FiltrosAnaliseQuimica & { organizationId?: string }): Promise<AnaliseQuimica[]> {
    const whereClause: Prisma.AnaliseQuimicaWhereInput = {};
    if (filtros?.organizationId) whereClause.organizationId = filtros.organizationId;
    if (filtros?.metalType) whereClause.metalType = filtros.metalType;
    if (filtros?.clienteId) whereClause.clienteId = filtros.clienteId;
    if (filtros?.numeroAnalise)
      whereClause.numeroAnalise = {
        contains: filtros.numeroAnalise,
        mode: 'insensitive',
      };
    if (filtros?.status) {
      if (Array.isArray(filtros.status)) {
        whereClause.status = {
          in: filtros.status as StatusAnaliseQuimicaPrisma[],
        };
      } else {
        whereClause.status = filtros.status as StatusAnaliseQuimicaPrisma;
      }
    }
    const dbAnalises = await this.prisma.analiseQuimica.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { dataCriacao: 'desc' },
    });

    // Mapeamento manual para garantir que o nome do cliente seja anexado
    return dbAnalises.map(dbAnalise => {
      const { cliente, ...analiseProps } = dbAnalise;
      const domainAnalise = AnaliseQuimica.reconstituir(
        {
          ...analiseProps,
          cliente: cliente || undefined,
        } as any,
        UniqueEntityID.create(dbAnalise.id),
      );
      return domainAnalise;
    }).filter((a): a is AnaliseQuimica => a !== null);
  }

  async create(analise: AnaliseQuimica, organizationId: string): Promise<AnaliseQuimica> {
    const data = this.mapToPrismaPayload(analise, organizationId);
    const dbAnalise = await this.prisma.analiseQuimica.create({ data });
    return this.mapToDomain(dbAnalise)!;
  }

  async save(analise: AnaliseQuimica, organizationId: string): Promise<AnaliseQuimica> {
    const { id, clienteId, numeroAnalise, ...updatePayload } =
      this.mapToPrismaPayload(analise, organizationId);
    console.log("Update Payload being sent to Prisma:", updatePayload);
    return this.mapToDomain(
      await this.prisma.analiseQuimica.update({
        where: { id: analise.id.toString() },
        data: updatePayload,
      }),
    )!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.analiseQuimica.delete({ where: { id } });
  }
}
