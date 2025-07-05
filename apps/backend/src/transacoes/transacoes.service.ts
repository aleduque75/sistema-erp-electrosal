import { Injectable, NotFoundException } from '@nestjs/common'; // Adicione NotFoundException
import { PrismaService } from '../prisma/prisma.service';
import { Transacao } from '@prisma/client';
import { CreateTransacaoDto, UpdateTransacaoDto } from './dtos/transacoes.dto';
@Injectable()
export class TransacoesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateTransacaoDto): Promise<Transacao> {
    const { contaCorrenteId, contaContabilId, userEnvolvidoId, ...rest } = data;

    return this.prisma.transacao.create({
      data: {
        ...rest,
        contaContabil: {
          connect: { id: contaContabilId },
        },
        ...(contaCorrenteId && {
          contaCorrente: { connect: { id: contaCorrenteId } },
        }),
        ...(userEnvolvidoId && {
          userEnvolvido: { connect: { id: userEnvolvidoId } },
        }),
      },
    });
  }

  async findAll(userId: string): Promise<Transacao[]> {
    return this.prisma.transacao.findMany({
      where: {
        OR: [
          { contaCorrente: { userId: userId } },
          { userEnvolvidoId: userId },
        ],
      },
    });
  }

  async findOne(userId: string, id: string): Promise<Transacao> {
    const transacao = await this.prisma.transacao.findFirst({
      where: {
        id,
        OR: [
          { contaCorrente: { userId: userId } },
          { userEnvolvidoId: userId },
        ],
      },
    });

    if (!transacao) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada.`);
    }
    return transacao;
  }

  async update(
    userId: string,
    id: string,
    data: UpdateTransacaoDto,
  ): Promise<Transacao> {
    // 1. Verifica se a transação existe e se o usuário tem permissão para acessá-la
    await this.findOne(userId, id);

    // 2. Se a verificação passou, atualiza o registro usando apenas o ID
    return this.prisma.transacao.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string): Promise<Transacao> {
    // 1. Verifica se a transação existe e se o usuário tem permissão para acessá-la
    await this.findOne(userId, id);

    // 2. Se a verificação passou, deleta o registro usando apenas o ID
    return this.prisma.transacao.delete({
      where: { id },
    });
  }

  async findExtract(
    userId: string,
    contaCorrenteId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Transacao[]> {
    return this.prisma.transacao.findMany({
      where: {
        contaCorrenteId,
        dataHora: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          { contaCorrente: { userId: userId } },
          { userEnvolvidoId: userId },
        ],
      },
      orderBy: {
        dataHora: 'asc',
      },
      include: { contaContabil: true },
    });
  }
}
//
