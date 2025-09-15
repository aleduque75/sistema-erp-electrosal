import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IAnaliseQuimicaRepository, StatusAnaliseQuimica } from '@sistema-erp-electrosal/core';

export interface ReprovarAnaliseCommand {
  analiseId: string;
  organizationId: string;
}

@Injectable()
export class ReprovarAnaliseUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepository: IAnaliseQuimicaRepository,
  ) {}

  async execute(command: ReprovarAnaliseCommand): Promise<void> {
    const { analiseId, organizationId } = command;

    const analise = await this.analiseRepository.findById(
      analiseId,
      organizationId,
    );

    if (!analise) {
      throw new NotFoundException(
        `Análise química com ID ${analiseId} não encontrada.`,
      );
    }

    if (analise.status !== StatusAnaliseQuimica.ANALISADO_AGUARDANDO_APROVACAO) {
      throw new ConflictException(
        `Análise não pode ser reprovada pois não está aguardando aprovação.`,
      );
    }

    analise.reprovar();

    await this.analiseRepository.save(analise);
  }
}
