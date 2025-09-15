import { Injectable } from '@nestjs/common';
import { IPessoaRepository, Pessoa, EmailVO, DocumentoFiscalVO, UniqueEntityID } from '@sistema-erp-electrosal/core';
import { PrismaService } from '../../prisma/prisma.service';
import { Pessoa as PrismaPessoa, Client, Fornecedor, Funcionario } from '@prisma/client';

// Define a type that includes relations for conversion
type PessoaWithRelations = PrismaPessoa & {
  client?: Client | null;
  fornecedor?: Fornecedor | null;
  funcionario?: Funcionario | null;
};

@Injectable()
export class PrismaPessoaRepository implements IPessoaRepository {
  constructor(private prisma: PrismaService) {}

  // Helper to convert Prisma model to domain entity
  private toDomain(prismaPessoa: PessoaWithRelations): Pessoa {
    return Pessoa.create(
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

  async findById(id: string, organizationId: string): Promise<Pessoa | null> {
    const pessoa = await this.prisma.pessoa.findUnique({
      where: {
        id: id,
        organizationId: organizationId,
      },
      include: {
        client: true, // Include client relation as it's needed for PDF
        fornecedor: true,
        funcionario: true,
      },
    });

    if (!pessoa) {
      return null;
    }

    return this.toDomain(pessoa);
  }

  async findByEmail(email: EmailVO, organizationId: string): Promise<Pessoa | null> {
    throw new Error('Method not implemented.');
  }
  async findByDocumento(documento: DocumentoFiscalVO, organizationId: string): Promise<Pessoa | null> {
    throw new Error('Method not implemented.');
  }
  async findByGoogleId(googleId: string, organizationId: string): Promise<Pessoa | null> {
    throw new Error('Method not implemented.');
  }

  async findAll(organizationId: string): Promise<Pessoa[]> {
    const pessoas = await this.prisma.pessoa.findMany({
      where: {
        organizationId: organizationId,
      },
      include: {
        client: true,
        fornecedor: true,
        funcionario: true,
      },
    });
    return pessoas.map(this.toDomain);
  }

  async findManyByIds(ids: string[], organizationId: string): Promise<Pessoa[]> {
    throw new Error('Method not implemented.');
  }
  async create(pessoa: Pessoa, organizationId: string): Promise<Pessoa> {
    throw new Error('Method not implemented.');
  }
  async save(pessoa: Pessoa, organizationId: string): Promise<Pessoa> {
    throw new Error('Method not implemented.');
  }
  async delete(id: string, organizationId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
