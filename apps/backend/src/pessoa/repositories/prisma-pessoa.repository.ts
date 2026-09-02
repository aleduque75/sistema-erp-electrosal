import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PessoaRepository } from './pessoa.repository';
import { PessoaEntity } from '../entities/pessoa.entity';
import { PessoaMapper } from '../mappers/pessoa.mapper';
import {
  IPessoaRepository,
  Pessoa as CorePessoa,
  EmailVO,
  DocumentoFiscalVO,
  UniqueEntityID,
} from '@sistema-erp-electrosal/core';

@Injectable()
export class PrismaPessoaRepository
  extends PessoaRepository
  implements IPessoaRepository
{
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private readonly includeRoles = {
    client: true,
    fornecedor: true,
    funcionario: true,
  };

  // =========================================================================
  // PessoaRepository (Domain-Driven Design)
  // =========================================================================

  async findAll(
    organizationId: string,
    role?: string,
  ): Promise<any[]> {
    if (role === 'CLIENT') {
      const clients = await this.prisma.client.findMany({
        where: { organizationId },
        include: { pessoa: { include: this.includeRoles } },
        orderBy: { pessoa: { name: 'asc' } },
      });
      return clients.map((c) => PessoaMapper.toDomain(c.pessoa));
    }

    if (role === 'FORNECEDOR') {
      const fornecedores = await this.prisma.fornecedor.findMany({
        where: { organizationId },
        include: { pessoa: { include: this.includeRoles } },
        orderBy: { pessoa: { name: 'asc' } },
      });
      return fornecedores.map((f) => PessoaMapper.toDomain(f.pessoa));
    }

    if (role === 'FUNCIONARIO') {
      const funcionarios = await this.prisma.funcionario.findMany({
        where: { organizationId },
        include: { pessoa: { include: this.includeRoles } },
        orderBy: { pessoa: { name: 'asc' } },
      });
      return funcionarios.map((f) => PessoaMapper.toDomain(f.pessoa));
    }

    const pessoas = await this.prisma.pessoa.findMany({
      where: { organizationId },
      include: this.includeRoles,
      orderBy: { name: 'asc' },
    });

    return pessoas.map((p) => PessoaMapper.toDomain(p));
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<any | null> {
    const pessoa = await this.prisma.pessoa.findFirst({
      where: { id, organizationId },
      include: this.includeRoles,
    });

    if (!pessoa) return null;
    return PessoaMapper.toDomain(pessoa);
  }

  async findByCpf(
    cpf: string,
    organizationId: string,
  ): Promise<PessoaEntity | null> {
    const cleanCpf = cpf.replace(/\D/g, '');
    const pessoa = await this.prisma.pessoa.findFirst({
      where: { organizationId, cpf: cleanCpf },
      include: this.includeRoles,
    });

    if (!pessoa) return null;
    return PessoaMapper.toDomain(pessoa);
  }

  async findByCnpj(
    cnpj: string,
    organizationId: string,
  ): Promise<PessoaEntity | null> {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    const pessoa = await this.prisma.pessoa.findFirst({
      where: { organizationId, cnpj: cleanCnpj },
      include: this.includeRoles,
    });

    if (!pessoa) return null;
    return PessoaMapper.toDomain(pessoa);
  }

  async findByEmail(
    email: string | EmailVO,
    organizationId: string,
  ): Promise<any | null> {
    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : email?.valor?.trim().toLowerCase() || '';
    const pessoa = await this.prisma.pessoa.findFirst({
      where: { organizationId, email: emailStr },
      include: this.includeRoles,
    });

    if (!pessoa) return null;
    return PessoaMapper.toDomain(pessoa);
  }

  async create(pessoa: any, organizationId?: string): Promise<any> {
    if (!(pessoa instanceof PessoaEntity)) {
      // Fallback for IPessoaRepository CorePessoa
      const data = pessoa.toObject();
      const created = await this.prisma.pessoa.create({
        data: {
          id: data.id,
          organizationId: organizationId!,
          name: data.name,
          type: data.type,
          cpf: data.cpf,
          birthDate: data.birthDate,
          gender: data.gender,
          cnpj: data.cnpj,
          razaoSocial: data.razaoSocial,
          email: data.email,
          phone: data.phone,
          cep: data.cep,
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.cidade,
          uf: data.uf,
        },
      });
      return this.toCoreDomain(created);
    }

    const orgId = pessoa.organizationId;
    const roles = pessoa.roles;

    const result = await this.prisma.$transaction(async (tx) => {
      const createdPessoa = await tx.pessoa.create({
        data: {
          organizationId: orgId,
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
        },
      });

      if (roles.includes('CLIENT')) {
        await tx.client.create({
          data: { pessoaId: createdPessoa.id, organizationId: orgId },
        });
      }

      if (roles.includes('FORNECEDOR')) {
        await tx.fornecedor.create({
          data: {
            pessoaId: createdPessoa.id,
            organizationId: orgId,
            defaultContaContabilId: pessoa.defaultContaContabilId,
          },
        });
      }

      if (roles.includes('FUNCIONARIO')) {
        await tx.funcionario.create({
          data: {
            pessoaId: createdPessoa.id,
            organizationId: orgId,
            hireDate: new Date(),
            position: 'N/A',
          },
        });
      }

      return tx.pessoa.findUniqueOrThrow({
        where: { id: createdPessoa.id },
        include: this.includeRoles,
      });
    });

    return PessoaMapper.toDomain(result);
  }

  async update(pessoa: PessoaEntity): Promise<PessoaEntity> {
    if (!pessoa.id) {
      throw new Error('Não é possível atualizar Pessoa sem ID.');
    }

    const organizationId = pessoa.organizationId;
    const id = pessoa.id;
    const roles = pessoa.roles;

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.pessoa.findUnique({
        where: { id },
        include: this.includeRoles,
      });

      if (!existing || existing.organizationId !== organizationId) {
        throw new Error(`Pessoa com ID ${id} não encontrada.`);
      }

      await tx.pessoa.update({
        where: { id },
        data: {
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
        },
      });

      // Sincronizar Client
      if (roles.includes('CLIENT') && !existing.client) {
        await tx.client.create({ data: { pessoaId: id, organizationId } });
      } else if (!roles.includes('CLIENT') && existing.client) {
        await tx.client.delete({ where: { pessoaId: id } });
      }

      // Sincronizar Fornecedor
      if (roles.includes('FORNECEDOR') && !existing.fornecedor) {
        await tx.fornecedor.create({
          data: {
            pessoaId: id,
            organizationId,
            defaultContaContabilId: pessoa.defaultContaContabilId,
          },
        });
      } else if (!roles.includes('FORNECEDOR') && existing.fornecedor) {
        await tx.fornecedor.delete({ where: { pessoaId: id } });
      } else if (roles.includes('FORNECEDOR') && existing.fornecedor) {
        if (pessoa.defaultContaContabilId !== undefined) {
          await tx.fornecedor.update({
            where: { pessoaId: id },
            data: { defaultContaContabilId: pessoa.defaultContaContabilId },
          });
        }
      }

      // Sincronizar Funcionario
      if (roles.includes('FUNCIONARIO') && !existing.funcionario) {
        await tx.funcionario.create({
          data: {
            pessoaId: id,
            organizationId,
            hireDate: new Date(),
            position: 'N/A',
          },
        });
      } else if (!roles.includes('FUNCIONARIO') && existing.funcionario) {
        await tx.funcionario.delete({ where: { pessoaId: id } });
      }

      return tx.pessoa.findUniqueOrThrow({
        where: { id },
        include: this.includeRoles,
      });
    });

    return PessoaMapper.toDomain(result);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.pessoa.delete({
      where: { id },
    });
  }

  async hasSalesHistory(id: string, organizationId: string): Promise<boolean> {
    const count = await this.prisma.sale.count({
      where: { pessoaId: id, organizationId },
    });
    return count > 0;
  }

  async hasPurchaseOrdersHistory(
    id: string,
    organizationId: string,
  ): Promise<boolean> {
    const count = await this.prisma.purchaseOrder.count({
      where: { fornecedorId: id, organizationId },
    });
    return count > 0;
  }

  async hasFinancialTransactions(
    id: string,
    organizationId: string,
  ): Promise<boolean> {
    const count = await this.prisma.accountPay.count({
      where: { fornecedorId: id, organizationId },
    });
    return count > 0;
  }

  // =========================================================================
  // IPessoaRepository Backwards Compatibility
  // =========================================================================

  private toCoreDomain(prismaPessoa: any): CorePessoa {
    return CorePessoa.create(
      {
        organizationId: prismaPessoa.organizationId,
        name: prismaPessoa.name,
        type: prismaPessoa.type,
        cpf: prismaPessoa.cpf || undefined,
        birthDate: prismaPessoa.birthDate || undefined,
        gender: prismaPessoa.gender || undefined,
        cnpj: prismaPessoa.cnpj || undefined,
        razaoSocial: prismaPessoa.razaoSocial || undefined,
        email: prismaPessoa.email || undefined,
        phone: prismaPessoa.phone || undefined,
        cep: prismaPessoa.cep || undefined,
        logradouro: prismaPessoa.logradouro || undefined,
        numero: prismaPessoa.numero || undefined,
        complemento: prismaPessoa.complemento || undefined,
        bairro: prismaPessoa.bairro || undefined,
        cidade: prismaPessoa.cidade || undefined,
        uf: prismaPessoa.uf || undefined,
        createdAt: prismaPessoa.createdAt,
        updatedAt: prismaPessoa.updatedAt,
      },
      UniqueEntityID.create(prismaPessoa.id),
    );
  }

  async findByDocumento(
    documento: DocumentoFiscalVO,
    organizationId: string,
  ): Promise<CorePessoa | null> {
    const cleanDoc = documento.numero;
    const pessoa = await this.prisma.pessoa.findFirst({
      where: {
        organizationId,
        OR: [{ cpf: cleanDoc }, { cnpj: cleanDoc }],
      },
      include: this.includeRoles,
    });
    return pessoa ? this.toCoreDomain(pessoa) : null;
  }

  async findByGoogleId(
    googleId: string,
    organizationId: string,
  ): Promise<CorePessoa | null> {
    return null;
  }

  async findManyByIds(
    ids: string[],
    organizationId: string,
  ): Promise<CorePessoa[]> {
    const pessoas = await this.prisma.pessoa.findMany({
      where: { id: { in: ids }, organizationId },
      include: this.includeRoles,
    });
    return pessoas.map((p) => this.toCoreDomain(p));
  }

  async save(pessoa: any, organizationId?: string): Promise<any> {
    if (pessoa instanceof PessoaEntity) {
      return this.update(pessoa);
    }
    const data = pessoa.toObject();
    const updated = await this.prisma.pessoa.update({
      where: { id: data.id },
      data: {
        name: data.name,
        type: data.type,
        cpf: data.cpf,
        birthDate: data.birthDate,
        gender: data.gender,
        cnpj: data.cnpj,
        razaoSocial: data.razaoSocial,
        email: data.email,
        phone: data.phone,
        cep: data.cep,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf,
      },
    });
    return this.toCoreDomain(updated);
  }
}
