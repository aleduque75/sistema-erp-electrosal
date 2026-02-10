import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Pessoa, PessoaType, Prisma } from '@prisma/client';
import {
  CreatePessoaDto,
  UpdatePessoaDto,
} from './dtos/create-pessoa.dto';

const pessoaWithRoles = Prisma.validator<Prisma.PessoaDefaultArgs>()({
  include: { client: true, fornecedor: true, funcionario: true },
});
type PessoaWithRoles = Prisma.PessoaGetPayload<typeof pessoaWithRoles>;

import { Logger } from '@nestjs/common';

@Injectable()
export class PessoaService {
  private readonly logger = new Logger(PessoaService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    role?: 'CLIENT' | 'FORNECEDOR' | 'FUNCIONARIO',
  ): Promise<Pessoa[]> {
    const includeRoles = {
      client: true,
      fornecedor: true,
      funcionario: true,
    };

    if (role === 'CLIENT') {
      const clients = await this.prisma.client.findMany({
        where: { organizationId },
        include: { pessoa: { include: includeRoles } },
        orderBy: { pessoa: { name: 'asc' } },
      });
      return clients.map((c) => c.pessoa);
    }
    if (role === 'FORNECEDOR') {
      this.logger.log(`Buscando fornecedores para a organização: ${organizationId}`);
      const fornecedores = await this.prisma.fornecedor.findMany({
        where: { organizationId },
        include: { pessoa: { include: includeRoles } },
        orderBy: { pessoa: { name: 'asc' } },
      });
      this.logger.log(`Encontrados ${fornecedores.length} fornecedores.`);
      return fornecedores.map((f) => f.pessoa);
    }
    if (role === 'FUNCIONARIO') {
      const funcionarios = await this.prisma.funcionario.findMany({
        where: { organizationId },
        include: { pessoa: { include: includeRoles } },
        orderBy: { pessoa: { name: 'asc' } },
      });
      return funcionarios.map((f) => f.pessoa);
    }

    // Fallback para buscar todas as pessoas se nenhum role for especificado
    return this.prisma.pessoa.findMany({
      where: { organizationId },
      include: includeRoles,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(organizationId: string, id: string): Promise<PessoaWithRoles> {
    const pessoa = await this.prisma.pessoa.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
        fornecedor: true,
        funcionario: true,
      },
    });

    if (!pessoa) {
      throw new NotFoundException(`Pessoa com ID ${id} não encontrada.`);
    }
    return pessoa;
  }

  async create(organizationId: string, data: CreatePessoaDto): Promise<PessoaWithRoles> {
    const { roles, ...pessoaData } = data;

    return this.prisma.$transaction(async (tx) => {
      const newPessoa = await tx.pessoa.create({
        data: {
          ...pessoaData,
          type: data.type, // Usar o tipo vindo do DTO
          organization: { connect: { id: organizationId } },
        },
      });

      if (roles?.includes('CLIENT')) {
        await tx.client.create({
          data: { pessoaId: newPessoa.id, organizationId },
        });
      }
      if (roles?.includes('FORNECEDOR')) {
        await tx.fornecedor.create({
          data: { 
            pessoaId: newPessoa.id, 
            organizationId,
            defaultContaContabilId: data.defaultContaContabilId 
          },
        });
      }
      if (roles?.includes('FUNCIONARIO')) {
        await tx.funcionario.create({
          data: {
            pessoaId: newPessoa.id,
            organizationId,
            hireDate: new Date(), // Valor padrão
            position: 'N/A', // Valor padrão
          },
        });
      }

      // Busca o resultado final dentro da mesma transação
      const result = await tx.pessoa.findUniqueOrThrow({
        where: { id: newPessoa.id },
        include: { client: true, fornecedor: true, funcionario: true },
      });
      return result;
    });
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdatePessoaDto,
  ): Promise<PessoaWithRoles> {
    const { roles, defaultContaContabilId, ...pessoaData } = data;

    return this.prisma.$transaction(async (tx) => {
      const existingPessoa = await tx.pessoa.findUnique({
        where: { id },
        include: { client: true, fornecedor: true, funcionario: true },
      });

      if (!existingPessoa || existingPessoa.organizationId !== organizationId) {
        throw new NotFoundException(`Pessoa com ID ${id} não encontrada.`);
      }

      await tx.pessoa.update({
        where: { id },
        data: pessoaData,
      });

      // Sincronizar papéis
      if (roles) {
        // Papel de Cliente
        if (roles.includes('CLIENT') && !existingPessoa.client) {
          await tx.client.create({ data: { pessoaId: id, organizationId } });
        } else if (!roles.includes('CLIENT') && existingPessoa.client) {
          await tx.client.delete({ where: { pessoaId: id } });
        }

        // Papel de Fornecedor
        if (roles.includes('FORNECEDOR') && !existingPessoa.fornecedor) {
          await tx.fornecedor.create({ data: { pessoaId: id, organizationId, defaultContaContabilId } });
        } else if (!roles.includes('FORNECEDOR') && existingPessoa.fornecedor) {
          await tx.fornecedor.delete({ where: { pessoaId: id } });
        }

        // Papel de Funcionário
        if (roles.includes('FUNCIONARIO') && !existingPessoa.funcionario) {
          await tx.funcionario.create({
            data: { pessoaId: id, organizationId, hireDate: new Date(), position: 'N/A' },
          });
        } else if (!roles.includes('FUNCIONARIO') && existingPessoa.funcionario) {
          await tx.funcionario.delete({ where: { pessoaId: id } });
        }
      }
      
      // Atualiza o defaultContaContabilId se o fornecedor já existir e o campo for passado
      if (existingPessoa.fornecedor && defaultContaContabilId !== undefined) {
        await tx.fornecedor.update({
          where: { pessoaId: id },
          data: { defaultContaContabilId },
        });
      }

      return tx.pessoa.findUniqueOrThrow({
        where: { id },
        include: { client: true, fornecedor: true, funcionario: true },
      });
    });
  }

  async remove(organizationId: string, id: string): Promise<Pessoa> {
    const pessoa = await this.findOne(organizationId, id);

    const saleCount = await this.prisma.sale.count({
      where: { pessoaId: id },
    });

    if (saleCount > 0) {
      throw new ConflictException(
        'Esta pessoa não pode ser removida pois possui um histórico de vendas.',
      );
    }

    // O schema usa onDelete: Cascade, então apagar a pessoa deve apagar os papéis
    return this.prisma.pessoa.delete({
      where: { id },
    });
  }
}
