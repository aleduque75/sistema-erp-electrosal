import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IAnaliseQuimicaRepository,
  AnaliseQuimica,
} from '@sistema-erp-electrosal/core';
import { AnaliseQuimicaWithClientNameDto } from '../dtos/analise-quimica-with-client-name.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BuscarAnaliseQuimicaPorIdUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly repo: IAnaliseQuimicaRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, organizationId: string): Promise<AnaliseQuimicaWithClientNameDto> {
    const analise = await this.repo.findById(id, organizationId);
    if (!analise) {
      throw new NotFoundException(
        `Análise Química com ID ${id} não encontrada.`,
      );
    }

    let clientName: string | undefined;
    if (analise.clienteId) {
      const client = await this.prisma.pessoa.findUnique({
        where: { id: analise.clienteId },
      });
      clientName = client?.name;
    }

    return {
      ...analise.toObject(),
      clientName,
    };
  }
}
