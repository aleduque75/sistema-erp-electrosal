import { Injectable, NotFoundException } from '@nestjs/common';
import { PessoaRepository } from '../repositories/pessoa.repository';
import { PessoaMapper } from '../mappers/pessoa.mapper';

@Injectable()
export class GetPessoaUseCase {
  constructor(private readonly pessoaRepository: PessoaRepository) {}

  async execute(organizationId: string, id: string) {
    const pessoa = await this.pessoaRepository.findById(id, organizationId);

    if (!pessoa) {
      throw new NotFoundException(`Pessoa com ID ${id} não encontrada.`);
    }

    return PessoaMapper.toResponseDto(pessoa);
  }
}
