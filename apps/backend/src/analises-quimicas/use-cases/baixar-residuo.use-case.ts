import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { IAnaliseQuimicaRepository, StatusAnaliseQuimica } from '@sistema-erp-electrosal/core';

@Injectable()
export class BaixarResiduoUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private analisesRepo: IAnaliseQuimicaRepository
  ) {}

  async execute(id: string, organizationId: string): Promise<void> {
    const analise = await this.analisesRepo.findById(id, organizationId);
    if (!analise) {
      throw new NotFoundException('Análise não encontrada');
    }

    // Check if it's RESIDUO or if it was marked as residue somehow.
    // Assuming status RESIDUO is correct based on previous search.
    if (analise.status !== StatusAnaliseQuimica.RESIDUO) {
      throw new BadRequestException('Apenas análises de resíduo podem ser baixadas como perda.');
    }

    analise.baixarComoPerda();
    await this.analisesRepo.save(analise, organizationId);
  }
}
