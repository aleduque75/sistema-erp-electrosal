import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { AnaliseQuimica, AnaliseQuimicaProps, IAnaliseQuimicaRepository, RegistrarNovaAnaliseDto } from '@sistema-erp-electrosal/core';
import { PrismaService } from '../../prisma/prisma.service';

export interface RegistrarNovaAnaliseCommand {
  dto: RegistrarNovaAnaliseDto;
  organizationId: string;
}

@Injectable()
export class RegistrarNovaAnaliseUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepo: IAnaliseQuimicaRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async getNextCrrNumber(organizationId: string): Promise<number> {
    const counter = await this.prisma.crrCounter.upsert({
      where: { organizationId },
      update: { lastCrrNumber: { increment: 1 } },
      create: { organizationId, lastCrrNumber: 3066 }, // Starts here, so first is 3066
    });
    return counter.lastCrrNumber;
  }

  async execute(command: RegistrarNovaAnaliseCommand): Promise<AnaliseQuimica> {
    const { dto, organizationId } = command;

    const nextNumber = await this.getNextCrrNumber(organizationId);
    const newNumeroAnalise = `CRR-${nextNumber}`;

    const existing = await this.analiseRepo.findByNumeroAnalise(newNumeroAnalise, organizationId);
    if (existing) {
      throw new ConflictException(`Análise química com número ${newNumeroAnalise} já existe.`);
    }

    const props: Omit<
      AnaliseQuimicaProps,
      'id' | 'dataCriacao' | 'dataAtualizacao' | 'status' | 'numeroAnalise'
    > = {
      clienteId: dto.clienteId,
      metalType: dto.metalType,
      dataEntrada: dto.dataEntrada,
      descricaoMaterial: dto.descricaoMaterial,
      volumeOuPesoEntrada: dto.volumeOuPesoEntrada,
      unidadeEntrada: dto.unidadeEntrada,
      observacoes: dto.observacoes ?? null,
      resultadoAnaliseValor: null,
      unidadeResultado: null,
      percentualQuebra: null,
      taxaServicoPercentual: null,
      teorRecuperavel: null,
      auEstimadoBrutoGramas: null,
      auEstimadoRecuperavelGramas: null,
      taxaServicoEmGramas: null,
      auLiquidoParaClienteGramas: null,
      dataAnaliseConcluida: null,
      dataAprovacaoCliente: null,
      dataFinalizacaoRecuperacao: null,
      ordemDeRecuperacaoId: null,
    };

    const novaAnalise = AnaliseQuimica.criar({
      ...props,
      numeroAnalise: newNumeroAnalise,
    });

    return this.analiseRepo.create(novaAnalise, organizationId);
  }
}
