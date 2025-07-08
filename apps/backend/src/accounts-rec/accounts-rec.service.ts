import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAccountRecDto,
  UpdateAccountRecDto,
  ReceivePaymentDto,
} from './dtos/account-rec.dto';
import { TipoTransacaoPrisma } from '@prisma/client';

@Injectable()
export class AccountsRecService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, createDto: CreateAccountRecDto) {
    return this.prisma.accountRec.create({
      data: {
        ...createDto,
        userId,
        received: false,
      },
    });
  }

  findAll(userId: string, search?: string) {
    const whereClause: any = { userId };
    if (search) {
      whereClause.description = { contains: search, mode: 'insensitive' };
    }
    return this.prisma.accountRec.findMany({
      where: whereClause,
      orderBy: { dueDate: 'asc' },
      include: { contaCorrente: true },
    });
  }

  async findOne(userId: string, id: string) {
    const account = await this.prisma.accountRec.findFirst({
      where: { id, userId },
    });
    if (!account) {
      throw new NotFoundException(
        `Conta a receber com ID ${id} não encontrada.`,
      );
    }
    return account;
  }

  async update(userId: string, id: string, updateDto: UpdateAccountRecDto) {
    await this.findOne(userId, id);
    return this.prisma.accountRec.update({
      where: { id },
      data: updateDto,
    });
  }

  async receive(userId: string, id: string, dto: ReceivePaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      const accountRec = await tx.accountRec.findFirst({
        where: { id, userId },
      });
      if (!accountRec || accountRec.received) {
        throw new NotFoundException('Conta a receber inválida ou já recebida.');
      }

      const updatedAccount = await tx.accountRec.update({
        where: { id },
        data: {
          received: true,
          receivedAt: dto.receivedAt,
          contaCorrenteId: dto.contaCorrenteId,
        },
      });

      

      const settings = await tx.userSettings.findUnique({ where: { userId } });
      if (!settings?.defaultCaixaContaId) {
        throw new BadRequestException(
          "Conta 'Caixa Padrão' não definida nas Configurações.",
        );
      }

      await tx.transacao.create({
        data: {
          tipo: TipoTransacaoPrisma.CREDITO,
          valor: accountRec.amount,
          moeda: 'BRL',
          descricao: `Recebimento de: ${accountRec.description}`,
          contaCorrenteId: dto.contaCorrenteId,
          contaContabilId: settings.defaultCaixaContaId,
          userId: userId, // ✅ CORREÇÃO APLICADA
        },
      });

      return updatedAccount;
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.accountRec.delete({ where: { id } });
  }
}
