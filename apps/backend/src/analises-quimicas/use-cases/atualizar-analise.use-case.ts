import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IAnaliseQuimicaRepository } from 'domain/analises-quimicas';
import { AtualizarAnaliseDto } from '../dtos/atualizar-analise.dto';

@Injectable()
export class AtualizarAnaliseUseCase {
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepo: IAnaliseQuimicaRepository,
  ) {}

  async execute({ id, organizationId, dto }: { id: string; organizationId: string; dto: AtualizarAnaliseDto }) {
    const analise = await this.analiseRepo.findById(id, organizationId);
    if (!analise) {
      throw new NotFoundException(`Análise com ID ${id} não encontrada.`);
    }

    if (dto.dataEntrada) analise.alterarDataEntrada(dto.dataEntrada);
    if (dto.descricaoMaterial)
      analise.alterarDescricaoMaterial(dto.descricaoMaterial);
    if (dto.volumeOuPesoEntrada !== undefined)
      analise.alterarVolumeOuPesoEntrada(dto.volumeOuPesoEntrada);
    if (dto.unidadeEntrada) analise.alterarUnidadeEntrada(dto.unidadeEntrada);
    if (dto.observacoes !== undefined)
      analise.adicionarOuAlterarObservacoes(dto.observacoes);

  return this.analiseRepo.save(analise, organizationId);
  }
}
