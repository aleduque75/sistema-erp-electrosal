import { Injectable, ConflictException } from '@nestjs/common';
import { PessoaRepository } from '../repositories/pessoa.repository';
import { PessoaEntity } from '../entities/pessoa.entity';
import { PessoaMapper } from '../mappers/pessoa.mapper';
import { CreatePessoaDto } from '../dtos/create-pessoa.dto';

@Injectable()
export class CreatePessoaUseCase {
  constructor(private readonly pessoaRepository: PessoaRepository) {}

  async execute(organizationId: string, dto: CreatePessoaDto) {
    // 1. Validar duplicidade de CPF (se fornecido)
    if (dto.cpf?.trim()) {
      const existingCpf = await this.pessoaRepository.findByCpf(
        dto.cpf,
        organizationId,
      );
      if (existingCpf) {
        throw new ConflictException(
          `Já existe uma pessoa cadastrada com o CPF informado.`,
        );
      }
    }

    // 2. Validar duplicidade de CNPJ (se fornecido)
    if ((dto as any).cnpj?.trim()) {
      const existingCnpj = await this.pessoaRepository.findByCnpj(
        (dto as any).cnpj,
        organizationId,
      );
      if (existingCnpj) {
        throw new ConflictException(
          `Já existe uma pessoa cadastrada com o CNPJ informado.`,
        );
      }
    }

    // 3. Criar a entidade de domínio
    const birthDate = dto.birthDate ? new Date(dto.birthDate) : undefined;
    const pessoa = PessoaEntity.create({
      organizationId,
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
      roles: (dto.roles as any) || [],
      defaultContaContabilId: dto.defaultContaContabilId,
    });

    // 4. Persistir através do repositório
    const created = await this.pessoaRepository.create(pessoa);
    return PessoaMapper.toResponseDto(created);
  }
}
