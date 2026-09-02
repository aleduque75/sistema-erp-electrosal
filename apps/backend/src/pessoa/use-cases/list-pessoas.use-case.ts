import { Injectable } from '@nestjs/common';
import { PessoaRepository } from '../repositories/pessoa.repository';
import { PessoaMapper } from '../mappers/pessoa.mapper';
import { ListPessoasQueryDto } from '../dtos/list-pessoas-query.dto';

@Injectable()
export class ListPessoasUseCase {
  constructor(private readonly pessoaRepository: PessoaRepository) {}

  async execute(organizationId: string, query?: ListPessoasQueryDto) {
    const pessoas = await this.pessoaRepository.findAll(organizationId, query);
    return pessoas.map((p) => PessoaMapper.toResponseDto(p));
  }
}
