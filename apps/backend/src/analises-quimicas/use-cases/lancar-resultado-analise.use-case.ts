import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IAnaliseQuimicaRepository } from 'domain/analises-quimicas';
import { LancarResultadoAnaliseDto } from '../dtos/lancar-resultado-analise.dto';

export interface LancarResultadoAnaliseCommand {
  id: string;
  dto: LancarResultadoAnaliseDto;
}

@Injectable()
export class LancarResultadoAnaliseUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly repo: IAnaliseQuimicaRepository,
  ) {}
  async execute(command: LancarResultadoAnaliseCommand & { organizationId: string }) {
    const analise = await this.repo.findById(command.id, command.organizationId);
    if (!analise)
      throw new NotFoundException(
        `Análise com ID ${command.id} não encontrada.`,
      );
    analise.lancarResultado(command.dto);
  return this.repo.save(analise, command.organizationId);
  }
}
