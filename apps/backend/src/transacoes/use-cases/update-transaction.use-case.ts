import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from 'decimal.js';
import { TipoTransacaoPrisma, TransacaoStatus } from '@prisma/client';

export interface UpdateTransactionCommand {
  organizationId: string;
  transactionId: string;
  newContaCorrenteId: string;
  newGoldAmount: number;
}

@Injectable()
export class UpdateTransactionUseCase {
  private readonly logger = new Logger(UpdateTransactionUseCase.name);

  constructor(private prisma: PrismaService) {}

  async execute(command: UpdateTransactionCommand): Promise<void> {
    this.logger.log(`Iniciando ajuste para a transação ID: ${command.transactionId}`);

    const originalTransacao = await this.prisma.transacao.findUnique({
      where: { id: command.transactionId, organizationId: command.organizationId },
      include: {
        accountRec: { include: { sale: true } }, // Corrected from AccountRec
      },
    });

    if (!originalTransacao) {
      throw new NotFoundException(`Transação com ID ${command.transactionId} não encontrada.`);
    }

    if (!originalTransacao.accountRec) { // Corrected from AccountRec
      throw new BadRequestException('A transação não está associada a um recebimento (AccountRec) e não pode ser ajustada por este método.');
    }

    // Criar uma constante local para garantir a tipagem
    const accountRec = originalTransacao.accountRec; // Corrected from AccountRec

    if (!accountRec.sale) {
      throw new BadRequestException('A transação não está associada a uma venda. Ajuste manual não implementado para este tipo.');
    }

    const sale = accountRec.sale;
    const goldPrice = sale.goldPrice;

    if (!goldPrice || goldPrice.isZero()) {
      throw new BadRequestException(`A venda associada (ID: ${sale.id}) não possui uma cotação de ouro válida.`);
    }

    const newGoldAmount = new Decimal(command.newGoldAmount);
    const newValorBRL = newGoldAmount.times(goldPrice);

    await this.prisma.$transaction(async (tx) => {
      // 1. Reverter a transação original (criar uma transação oposta na conta antiga)
      if (originalTransacao.contaCorrenteId) {
        this.logger.log(`Revertendo lançamento na conta antiga: ${originalTransacao.contaCorrenteId}`);
        await tx.transacao.create({
          data: {
            organizationId: command.organizationId,
            tipo: originalTransacao.tipo === 'CREDITO' ? 'DEBITO' : 'CREDITO',
            valor: originalTransacao.valor.negated(),
            goldAmount: originalTransacao.goldAmount?.negated(),
            moeda: originalTransacao.moeda,
            descricao: `[ESTORNO] Ajuste da transação ${originalTransacao.id}`,
            dataHora: new Date(),
            contaCorrenteId: originalTransacao.contaCorrenteId,
            contaContabilId: originalTransacao.contaContabilId, // Usar a mesma conta contábil
            status: TransacaoStatus.AJUSTADA, // Marcar como ajustada
          },
        });
      }

      // 2. Criar a nova transação na conta correta com os novos valores
      this.logger.log(`Criando novo lançamento na conta: ${command.newContaCorrenteId}`);
      await tx.transacao.create({
        data: {
          organizationId: command.organizationId,
          tipo: originalTransacao.tipo,
          valor: newValorBRL,
          goldAmount: newGoldAmount,
          moeda: originalTransacao.moeda,
          descricao: `[AJUSTE] ${originalTransacao.descricao}`,
          dataHora: originalTransacao.dataHora, // Manter a data original
          contaCorrenteId: command.newContaCorrenteId,
          contaContabilId: originalTransacao.contaContabilId,
          accountRecId: accountRec.id, // Corrected from connect syntax
          status: TransacaoStatus.ATIVA, // A nova transação é ativa
        },
      });

      // 3. Marcar a transação original como "ajustada"
      await tx.transacao.update({
        where: { id: originalTransacao.id },
        data: { status: TransacaoStatus.AJUSTADA },
      });
    });

    this.logger.log(`Ajuste da transação ${command.transactionId} concluído com sucesso.`);
  }
}
