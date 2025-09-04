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
import { AccountRec, Prisma, TipoTransacaoPrisma } from '@prisma/client';
import { SettingsService } from '../settings/settings.service'; // Added

@Injectable()
export class AccountsRecService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService, // Injected
  ) {}

  async create(
    organizationId: string,
    data: CreateAccountRecDto,
  ): Promise<AccountRec> {
    return this.prisma.accountRec.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string): Promise<AccountRec[]> {
    return this.prisma.accountRec.findMany({
      where: { organizationId },
      include: { sale: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<AccountRec> {
    const account = await this.prisma.accountRec.findFirst({
      where: { id, organizationId },
    });
    if (!account) {
      throw new NotFoundException(
        `Conta a receber com ID ${id} não encontrada.`,
      );
    }
    return account;
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateAccountRecDto,
  ): Promise<AccountRec> {
    await this.findOne(organizationId, id);
    return this.prisma.accountRec.update({
      where: { id },
      data,
    });
  }

  async receive(
    organizationId: string,
    userId: string, // Added userId
    id: string,
    data: ReceivePaymentDto,
  ): Promise<any> {
    const [accountToReceive, settings] = await Promise.all([
      this.findOne(organizationId, id),
      this.settingsService.findOne(userId), // Used SettingsService
    ]);

    if (!settings?.defaultCaixaContaId) {
      throw new BadRequestException(
        "Nenhuma conta 'Caixa' padrão foi configurada para registrar recebimentos.",
      );
    }

    const receivedAt = data.receivedAt || new Date();
    const amountReceived =
      data.amountReceived || accountToReceive.amount.toNumber();

    return this.prisma.$transaction(async (tx) => {
      const updatedAccountRec = await tx.accountRec.update({
        where: { id },
        data: {
          received: true,
          receivedAt: receivedAt,
          contaCorrenteId: data.contaCorrenteId,
        },
      });

      await tx.transacao.create({
        data: {
          organizationId,
          contaCorrenteId: data.contaCorrenteId,
          contaContabilId: settings.defaultCaixaContaId!,
          tipo: TipoTransacaoPrisma.CREDITO,
          descricao: `Recebimento de: ${accountToReceive.description}`,
          valor: amountReceived,
          moeda: 'BRL',
          dataHora: receivedAt,
        },
      });

      return updatedAccountRec;
    });
  } // <-- ESTA CHAVE ESTAVA FALTANDO

  async remove(organizationId: string, id: string): Promise<AccountRec> {
    await this.findOne(organizationId, id);
    return this.prisma.accountRec.delete({
      where: { id },
    });
  }
}
