import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContaContabilDto,
  UpdateContaContabilDto,
} from './dtos/contas-contabeis.dto';

@Injectable()
export class ContasContabeisService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateContaContabilDto) {
    const existingCode = await this.prisma.contaContabil.findFirst({
      where: { userId, codigo: data.codigo },
    });
    if (existingCode) {
      throw new ConflictException('O código da conta já está em uso.');
    }
    return this.prisma.contaContabil.create({ data: { ...data, userId } });
  }

  async findAll(userId: string) {
    return this.prisma.contaContabil.findMany({
      where: { userId },
      orderBy: { codigo: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const conta = await this.prisma.contaContabil.findFirst({
      where: { id, userId },
    });
    if (!conta) {
      throw new NotFoundException(
        `Conta contábil com ID ${id} não encontrada.`,
      );
    }
    return conta;
  }

  async update(userId: string, id: string, data: UpdateContaContabilDto) {
    await this.findOne(userId, id);

    // Esta verificação agora funcionará com o DTO correto
    if (data.codigo) {
      const existingCode = await this.prisma.contaContabil.findFirst({
        where: { userId, codigo: data.codigo, id: { not: id } },
      });
      if (existingCode) {
        throw new ConflictException(
          'O código da conta já pertence a outra conta.',
        );
      }
    }
    return this.prisma.contaContabil.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    const subContasCount = await this.prisma.contaContabil.count({
      where: { contaPaiId: id },
    });
    if (subContasCount > 0) {
      throw new ConflictException(
        'Esta conta não pode ser removida pois possui sub-contas.',
      );
    }
    const transacoesCount = await this.prisma.transacao.count({
      where: { contaContabilId: id },
    });
    if (transacoesCount > 0) {
      throw new ConflictException(
        'Esta conta não pode ser removida pois possui transações associadas.',
      );
    }
    return this.prisma.contaContabil.delete({ where: { id } });
  }
}
