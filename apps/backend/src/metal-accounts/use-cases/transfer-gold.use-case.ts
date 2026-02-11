import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransferGoldDto } from '../dtos/transfer-gold.dto';

@Injectable()
export class TransferGoldUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: TransferGoldDto, organizationId: string): Promise<void> {
    const { fromAccountId, toAccountId, amount, description } = dto;

    const fromAccount = await this.prisma.contaCorrente.findFirst({
      where: { id: fromAccountId, organizationId, moeda: 'XAU' },
    });

    if (!fromAccount) {
      throw new NotFoundException(`Conta de origem não encontrada.`);
    }

    const toAccount = await this.prisma.contaCorrente.findFirst({
      where: { id: toAccountId, organizationId, moeda: 'XAU' },
    });

    if (!toAccount) {
      throw new NotFoundException(`Conta de destino não encontrada.`);
    }

    await this.prisma.$transaction(async (tx) => {
      // TODO: Verify if this is the correct accounting account for transfers
      const contaContabil = await tx.contaContabil.findFirstOrThrow({
        where: { organizationId, codigo: '3.1.1.03' },
      });

      // Debitar da conta de origem
      await tx.transacao.create({
        data: {
          contaCorrenteId: fromAccountId,
          valor: amount,
          tipo: 'DEBITO',
          descricao: description || `Transferência para ${toAccount.nome}`,
          dataHora: new Date(),
          organizationId,
          moeda: 'XAU',
          contaContabilId: contaContabil.id,
        },
      });

      // Creditar na conta de destino
      await tx.transacao.create({
        data: {
          contaCorrenteId: toAccountId,
          valor: amount,
          tipo: 'CREDITO',
          descricao: description || `Transferência de ${fromAccount.nome}`,
          dataHora: new Date(),
          organizationId,
          moeda: 'XAU',
          contaContabilId: contaContabil.id,
        },
      });
    });
  }
}
