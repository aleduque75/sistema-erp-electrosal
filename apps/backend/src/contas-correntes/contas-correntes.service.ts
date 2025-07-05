import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContaCorrente } from '@prisma/client';
import {
  CreateContaCorrenteDto,
  UpdateContaCorrenteDto,
} from './dtos/contas-correntes.dto';

@Injectable()
export class ContasCorrentesService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    data: CreateContaCorrenteDto,
  ): Promise<ContaCorrente> {
    return this.prisma.contaCorrente.create({
      data: {
        ...data,
        saldo: data.saldo,
        dataAbertura: new Date(data.dataAbertura),
        userId,
      },
    });
  }

  async findAll(userId: string): Promise<ContaCorrente[]> {
    return this.prisma.contaCorrente.findMany({
      where: { userId, deletedAt: null },
    });
  }

  async findOne(userId: string, id: string): Promise<ContaCorrente | null> {
    return this.prisma.contaCorrente.findUnique({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });
  }

  async findOneByNumeroConta(
    userId: string,
    numeroConta: string,
  ): Promise<ContaCorrente | null> {
    return this.prisma.contaCorrente.findUnique({
      where: {
        userId_numeroConta: {
          userId,
          numeroConta,
        },
        deletedAt: null,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    data: UpdateContaCorrenteDto,
  ): Promise<ContaCorrente> {
    return this.prisma.contaCorrente.update({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      data,
    });
  }

  async remove(userId: string, id: string): Promise<ContaCorrente> {
    return this.prisma.contaCorrente.update({
      where: {
        id,
        userId,
      },
      data: { deletedAt: new Date() },
    });
  }

  async getOpeningBalance(
    contaCorrenteId: string,
    startDate: Date,
  ): Promise<number> {
    const grouped = await this.prisma.transacao.groupBy({
      by: ['tipo'],
      where: {
        contaCorrenteId: contaCorrenteId,
        dataHora: {
          lt: startDate, // 'lt' (less than) - todas as transações ANTES da data de início
        },
      },
      _sum: {
        valor: true, // Prisma vai somar os valores
      },
    });

    let openingBalance = 0;
    for (const group of grouped) {
      const sum = group._sum.valor ?? 0;
      if (group.tipo === 'CREDITO') {
        openingBalance += Number(sum);
      } else {
        // DEBITO
        openingBalance -= Number(sum);
      }
    }

    return openingBalance;
  }
}
