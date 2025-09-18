import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cotacao, TipoMetal } from '@prisma/client';
import { CreateCotacaoDto } from './dtos/create-cotacao.dto';

@Injectable()
export class CotacoesService {
  constructor(private prisma: PrismaService) {}

  async create(createCotacaoDto: CreateCotacaoDto, organizationId: string): Promise<Cotacao> {
    return this.prisma.cotacao.create({
      data: {
        ...createCotacaoDto,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string): Promise<Cotacao[]> {
    return this.prisma.cotacao.findMany({
      where: { organizationId },
      orderBy: { data: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Cotacao | null> {
    const cotacao = await this.prisma.cotacao.findFirst({
      where: { id, organizationId },
    });
    if (!cotacao) {
      throw new NotFoundException(`Cotação com ID '${id}' não encontrada.`);
    }
    return cotacao;
  }

  async findLatest(metal: TipoMetal, organizationId: string): Promise<Cotacao | null> {
    const cotacao = await this.prisma.cotacao.findFirst({
      where: {
        metal,
        organizationId,
      },
      orderBy: { data: 'desc' },
    });
    if (!cotacao) {
      throw new NotFoundException(`Nenhuma cotação encontrada para o metal '${metal}'.`);
    }
    return cotacao;
  }

  async remove(id: string, organizationId: string): Promise<Cotacao> {
    // First, check if it exists
    await this.findOne(id, organizationId);
    return this.prisma.cotacao.delete({
      where: { id },
    });
  }
}
