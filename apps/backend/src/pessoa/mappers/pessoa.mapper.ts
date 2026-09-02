import { Pessoa as PrismaPessoa, Client, Fornecedor, Funcionario } from '@prisma/client';
import { PessoaEntity } from '../entities/pessoa.entity';
import { PessoaRoleType } from '../value-objects/pessoa-role.vo';

export type PrismaPessoaWithRoles = PrismaPessoa & {
  client?: Client | null;
  fornecedor?: Fornecedor | null;
  funcionario?: Funcionario | null;
};

export class PessoaMapper {
  static toDomain(raw: PrismaPessoaWithRoles): PessoaEntity {
    const roles: PessoaRoleType[] = [];
    if (raw.client) roles.push('CLIENT');
    if (raw.fornecedor) roles.push('FORNECEDOR');
    if (raw.funcionario) roles.push('FUNCIONARIO');

    return PessoaEntity.create({
      id: raw.id,
      organizationId: raw.organizationId,
      name: raw.name,
      type: raw.type,
      razaoSocial: raw.razaoSocial,
      cpf: raw.cpf,
      cnpj: raw.cnpj,
      email: raw.email,
      phone: raw.phone,
      birthDate: raw.birthDate,
      gender: raw.gender,
      cep: raw.cep,
      logradouro: raw.logradouro,
      numero: raw.numero,
      complemento: raw.complemento,
      bairro: raw.bairro,
      cidade: raw.cidade,
      uf: raw.uf,
      roles,
      defaultContaContabilId: raw.fornecedor?.defaultContaContabilId || null,
      externalId: raw.externalId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toResponseDto(pessoa: PessoaEntity): any {
    const roles = pessoa.roles;
    return {
      id: pessoa.id,
      organizationId: pessoa.organizationId,
      name: pessoa.name,
      type: pessoa.type,
      razaoSocial: pessoa.razaoSocial,
      cpf: pessoa.cpf,
      cnpj: pessoa.cnpj,
      email: pessoa.email,
      phone: pessoa.phone,
      birthDate: pessoa.birthDate,
      gender: pessoa.gender,
      cep: pessoa.cep,
      logradouro: pessoa.logradouro,
      numero: pessoa.numero,
      complemento: pessoa.complemento,
      bairro: pessoa.bairro,
      cidade: pessoa.cidade,
      uf: pessoa.uf,
      roles,
      defaultContaContabilId: pessoa.defaultContaContabilId,
      client: pessoa.hasRole('CLIENT')
        ? {
            pessoaId: pessoa.id,
            organizationId: pessoa.organizationId,
          }
        : null,
      fornecedor: pessoa.hasRole('FORNECEDOR')
        ? {
            pessoaId: pessoa.id,
            organizationId: pessoa.organizationId,
            defaultContaContabilId: pessoa.defaultContaContabilId,
          }
        : null,
      funcionario: pessoa.hasRole('FUNCIONARIO')
        ? {
            pessoaId: pessoa.id,
            organizationId: pessoa.organizationId,
          }
        : null,
      createdAt: pessoa.createdAt,
      updatedAt: pessoa.updatedAt,
    };
  }
}
