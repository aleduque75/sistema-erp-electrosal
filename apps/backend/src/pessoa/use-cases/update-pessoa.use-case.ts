import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PessoaRepository } from '../repositories/pessoa.repository';
import { PessoaMapper } from '../mappers/pessoa.mapper';
import { UpdatePessoaDto } from '../dtos/create-pessoa.dto';

@Injectable()
export class UpdatePessoaUseCase {
  constructor(private readonly pessoaRepository: PessoaRepository) {}

  async execute(organizationId: string, id: string, dto: UpdatePessoaDto) {
    const pessoa = await this.pessoaRepository.findById(id, organizationId);
    if (!pessoa) {
      throw new NotFoundException(`Pessoa com ID ${id} não encontrada.`);
    }

    // Validar duplicidade de CPF ao alterar
    if (dto.cpf?.trim()) {
      const existingCpf = await this.pessoaRepository.findByCpf(
        dto.cpf,
        organizationId,
      );
      if (existingCpf && existingCpf.id !== id) {
        throw new ConflictException(
          `Já existe outra pessoa cadastrada com o CPF informado.`,
        );
      }
    }

    // Validar duplicidade de CNPJ ao alterar
    if ((dto as any).cnpj?.trim()) {
      const existingCnpj = await this.pessoaRepository.findByCnpj(
        (dto as any).cnpj,
        organizationId,
      );
      if (existingCnpj && existingCnpj.id !== id) {
        throw new ConflictException(
          `Já existe outra pessoa cadastrada com o CNPJ informado.`,
        );
      }
    }

    const birthDate = dto.birthDate ? new Date(dto.birthDate) : undefined;
    pessoa.updateDetails({
      name: dto.name,
      type: dto.type,
      razaoSocial: (dto as any).razaoSocial,
      cpf: dto.cpf,
      cnpj: (dto as any).cnpj,
      email: dto.email,
      phone: dto.phone,
      birthDate,
      gender: dto.gender,
      cep: dto.cep,
      logradouro: dto.logradouro,
      numero: dto.numero,
      complemento: dto.complemento,
      bairro: dto.bairro,
      cidade: dto.cidade,
      uf: dto.uf,
      roles: dto.roles as any,
      defaultContaContabilId: dto.defaultContaContabilId,
    });

    const updated = await this.pessoaRepository.update(pessoa);
    return PessoaMapper.toResponseDto(updated);
  }
}
