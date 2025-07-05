import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContaContabil } from '@prisma/client';
import {
  CreateContaContabilDto,
  UpdateContaContabilDto,
} from './dtos/contas-contabeis.dto';

@Injectable()
export class ContasContabeisService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    data: CreateContaContabilDto,
  ): Promise<ContaContabil> {
    return this.prisma.contaContabil.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findAll(userId: string): Promise<ContaContabil[]> {
    return this.prisma.contaContabil.findMany({ where: { userId } });
  }

  async findOne(userId: string, id: string): Promise<ContaContabil | null> {
    return this.prisma.contaContabil.findUnique({
      where: {
        id,
        userId,
      },
    });
  }

  async findOneByCodigo(
    userId: string,
    codigo: string,
  ): Promise<ContaContabil | null> {
    return this.prisma.contaContabil.findUnique({
      where: {
        userId_codigo: {
          userId,
          codigo,
        },
      },
    });
  }

  async update(
    userId: string,
    id: string,
    data: UpdateContaContabilDto,
  ): Promise<ContaContabil> {
    return this.prisma.contaContabil.update({
      where: {
        id,
        userId,
      },
      data,
    });
  }

  async remove(userId: string, id: string): Promise<ContaContabil> {
    // 1. Garante que a conta existe e pertence ao usuário
    const contaContabil = await this.prisma.contaContabil.findUnique({
      where: { id, userId },
    });

    if (!contaContabil) {
      throw new NotFoundException(
        `Conta contábil com ID ${id} não encontrada.`,
      );
    }

    // 2. Verifica se a conta é pai de alguma outra conta
    const subContasCount = await this.prisma.contaContabil.count({
      where: { contaPaiId: id },
    });

    if (subContasCount > 0) {
      throw new ConflictException(
        'Esta conta não pode ser removida pois é uma conta pai para outras sub-contas.',
      );
    }

    // 3. Verifica se existem transações associadas a esta conta
    const transacoesCount = await this.prisma.transacao.count({
      where: { contaContabilId: id },
    });

    if (transacoesCount > 0) {
      throw new ConflictException(
        'Esta conta não pode ser removida pois possui transações financeiras associadas.',
      );
    }

    // 4. Se todas as verificações passarem, pode deletar com segurança
    return this.prisma.contaContabil.delete({
      where: { id },
    });
  }
}
