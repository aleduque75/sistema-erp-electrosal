import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Recuperacao,
  IRecuperacaoRepository,
  FiltrosRecuperacao,
  StatusRecuperacao,
} from '@sistema-erp-electrosal/core';
import { Prisma, Recuperacao as PrismaRecuperacao, StatusRecuperacaoPrisma } from '@prisma/client';

@Injectable()
export class PrismaRecuperacaoRepository implements IRecuperacaoRepository {
  constructor(private prisma: PrismaService) {}

  private mapToDomain(dbData: PrismaRecuperacao | null): Recuperacao | null {
    if (!dbData) return null;
    return new Recuperacao({
      id: dbData.id,
      organizationId: dbData.organizationId,
      analiseQuimicaId: dbData.analiseQuimicaId,
      dataInicio: dbData.dataInicio,
      dataFim: dbData.dataFim,
      descricaoProcesso: dbData.descricaoProcesso,
      volumeProcessado: dbData.volumeProcessado,
      unidadeProcessada: dbData.unidadeProcessada,
      resultadoFinal: dbData.resultadoFinal,
      unidadeResultado: dbData.unidadeResultado,
      status: dbData.status as StatusRecuperacao,
      observacoes: dbData.observacoes,
      dataCriacao: dbData.dataCriacao,
      dataAtualizacao: dbData.dataAtualizacao,
    });
  }

  public mapToPrismaPayload(
    recuperacao: Recuperacao,
    organizationId: string,
  ): Prisma.RecuperacaoUncheckedCreateInput {
    return {
      id: recuperacao.id,
      organizationId,
      analiseQuimicaId: recuperacao.analiseQuimicaId,
      dataInicio: recuperacao.dataInicio,
      dataFim: recuperacao.dataFim,
      descricaoProcesso: recuperacao.descricaoProcesso,
      volumeProcessado: recuperacao.volumeProcessado,
      unidadeProcessada: recuperacao.unidadeProcessada,
      resultadoFinal: recuperacao.resultadoFinal,
      unidadeResultado: recuperacao.unidadeResultado,
      status: recuperacao.status as StatusRecuperacaoPrisma,
      observacoes: recuperacao.observacoes,
      dataCriacao: recuperacao.dataCriacao,
      dataAtualizacao: recuperacao.dataAtualizacao,
    };
  }

  async findById(id: string, organizationId: string): Promise<Recuperacao | null> {
    const dbRec = await this.prisma.recuperacao.findFirst({
      where: { id, organizationId },
    });
    return this.mapToDomain(dbRec);
  }

  async findAll(filtros?: FiltrosRecuperacao): Promise<Recuperacao[]> {
    const where: Prisma.RecuperacaoWhereInput = {};
    if (filtros?.organizationId) where.organizationId = filtros.organizationId;
    if (filtros?.analiseQuimicaId) where.analiseQuimicaId = filtros.analiseQuimicaId;
    if (filtros?.status) {
      if (Array.isArray(filtros.status)) {
        where.status = { in: filtros.status as StatusRecuperacaoPrisma[] };
      } else {
        where.status = filtros.status as StatusRecuperacaoPrisma;
      }
    }
    const dbRecs = await this.prisma.recuperacao.findMany({ where });
    return dbRecs.map((db) => this.mapToDomain(db)).filter((r): r is Recuperacao => r !== null);
  }

  async create(recuperacao: Recuperacao, organizationId: string): Promise<Recuperacao> {
    const data = this.mapToPrismaPayload(recuperacao, organizationId);
    const dbRec = await this.prisma.recuperacao.create({ data });
    return this.mapToDomain(dbRec)!;
  }

  async save(recuperacao: Recuperacao, organizationId: string): Promise<Recuperacao> {
    const { id, ...updatePayload } = this.mapToPrismaPayload(recuperacao, organizationId);
    const dbRec = await this.prisma.recuperacao.update({
      where: { id: recuperacao.id },
      data: updatePayload,
    });
    return this.mapToDomain(dbRec)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recuperacao.delete({ where: { id } });
  }
}
