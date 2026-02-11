import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IAnaliseQuimicaRepository, StatusAnaliseQuimica } from '@sistema-erp-electrosal/core';

export interface RefazerAnaliseCommand {
  analiseId: string;
  organizationId: string;
}

@Injectable()
export class RefazerAnaliseUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepository: IAnaliseQuimicaRepository,
  ) {}

  async execute(command: RefazerAnaliseCommand): Promise<void> {
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
        `Análise não pode ser refeita pois não está aguardando aprovação.`,
      );
    }

    analise.refazer();

    await this.analiseRepository.save(analise);
  }
}
