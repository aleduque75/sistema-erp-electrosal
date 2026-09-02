import { Injectable } from '@nestjs/common';
import { PessoaRepository } from '../repositories/pessoa.repository';
import { PessoaMapper } from '../mappers/pessoa.mapper';

@Injectable()
export class ListPessoasUseCase {
  constructor(private readonly pessoaRepository: PessoaRepository) {}

  async execute(
    organizationId: string,
    role?: 'CLIENT' | 'FORNECEDOR' | 'FUNCIONARIO',
  ) {
    const pessoas = await this.pessoaRepository.findAll(organizationId, role);
    return pessoas.map((p) => PessoaMapper.toResponseDto(p));
  }
}
