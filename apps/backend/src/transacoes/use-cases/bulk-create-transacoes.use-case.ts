import { Injectable, BadRequestException } from '@nestjs/common';
import { TransacaoRepository } from '../repositories/transacao.repository';
import { BulkCreateTransacaoDto } from '../dtos/bulk-create-transacao.dto';
import { TransacaoEntity } from '../entities/transacao.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { TipoTransacaoPrisma } from '@prisma/client';

@Injectable()
export class BulkCreateTransacoesUseCase {
  constructor(
    private readonly transacaoRepository: TransacaoRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    dto: BulkCreateTransacaoDto,
    organizationId: string,
  ): Promise<{ count: number }> {
    const { contaCorrenteId, transactions } = dto;

    if (!transactions || transactions.length === 0) {
      return { count: 0 };
    }

    // Identificar conta contábil padrão para transferências, caso alguma precise
    let defaultTransferContaContabilId: string | null = null;
    const getDefaultTransferContaId = async () => {
      if (defaultTransferContaContabilId) return defaultTransferContaContabilId;
      const contaTransfer = await this.prisma.contaContabil.findFirst({
        where: {
          organizationId,
          OR: [
            { nome: { contains: 'Transferências Internas', mode: 'insensitive' } },
            { nome: { contains: 'Transferência', mode: 'insensitive' } },
          ],
        },
      });
      if (contaTransfer) {
        defaultTransferContaContabilId = contaTransfer.id;
      } else {
        const anyConta = await this.prisma.contaContabil.findFirst({
          where: { organizationId },
        });
        defaultTransferContaContabilId = anyConta?.id || null;
      }
      return defaultTransferContaContabilId;
    };

    // Busca cotações de Ouro (AU) para garantir cotação e peso em metal em todos os lançamentos
    const quotations = await this.prisma.quotation.findMany({
      where: { organizationId, metal: 'AU' },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    const getQuoteForDate = (postedAt: Date | string) => {
      const d = new Date(postedAt).toISOString().split('T')[0];
      const match = quotations.find((q) => {
        const qDate = new Date(q.date).toISOString().split('T')[0];
        return qDate <= d;
      });
      const effective = match || (quotations.length > 0 ? quotations[0] : null);
      return effective ? Number(effective.buyPrice || effective.sellPrice) : null;
    };

    const regularItems = transactions.filter((t) => !t.isTransfer);
    const transferItems = transactions.filter(
      (t) => t.isTransfer && t.destinationContaCorrenteId,
    );

    return this.transacaoRepository.executeInTransaction(async (tx) => {
      let createdCount = 0;

      // 1. Processar transações regulares
      if (regularItems.length > 0) {
        for (const t of regularItems) {
          if (!t.contaContabilId) {
            throw new BadRequestException(
              `A transação "${t.description}" precisa de uma categoria (conta contábil).`,
            );
          }
          const goldPrice = t.goldPrice || getQuoteForDate(t.postedAt);
          const goldAmount =
            t.goldAmount ||
            (goldPrice && goldPrice > 0
              ? Number((t.amount / goldPrice).toFixed(4))
              : null);

          const entity = TransacaoEntity.create({
            fitId: t.fitId,
            tipo: t.tipo,
            descricao: t.description,
            contaContabilId: t.contaContabilId,
            valor: t.amount,
            goldPrice,
            goldAmount,
            dataHora: t.postedAt,
            organizationId: organizationId,
            contaCorrenteId: contaCorrenteId,
            moeda: 'BRL',
          });
          await this.transacaoRepository.create(entity, tx);
          createdCount++;
        }
      }

      // 2. Processar transferências vinculadas
      for (const t of transferItems) {
        const destinationAccountId = t.destinationContaCorrenteId!;
        const contaContabilId =
          t.contaContabilId || (await getDefaultTransferContaId());

        if (!contaContabilId) {
          throw new BadRequestException(
            `Não foi possível determinar a conta contábil para a transferência "${t.description}".`,
          );
        }

        const [sourceAcc, destAcc] = await Promise.all([
          this.prisma.contaCorrente.findUnique({
            where: { id: contaCorrenteId },
          }),
          this.prisma.contaCorrente.findUnique({
            where: { id: destinationAccountId },
          }),
        ]);

        const sourceName = sourceAcc?.nome || 'Conta';
        const destName = destAcc?.nome || 'Conta Destino';
        const dataHoraDate = t.postedAt ? new Date(t.postedAt) : new Date();

        const goldPrice = t.goldPrice || getQuoteForDate(t.postedAt);
        const goldAmount =
          t.goldAmount ||
          (goldPrice && goldPrice > 0
            ? Number((t.amount / goldPrice).toFixed(4))
            : null);

        if (t.tipo === TipoTransacaoPrisma.DEBITO) {
          // Débito na conta corrente importada (origem), Crédito na conta destino
          const debitEntity = TransacaoEntity.create({
            organizationId,
            tipo: TipoTransacaoPrisma.DEBITO,
            valor: t.amount,
            goldPrice,
            goldAmount,
            moeda: 'BRL',
            descricao: t.description || `Transferência para ${destName}`,
            dataHora: dataHoraDate,
            contaContabilId,
            contaCorrenteId: contaCorrenteId,
            fitId: t.fitId,
          });
          const debitTx = await this.transacaoRepository.create(debitEntity, tx);

          const creditEntity = TransacaoEntity.create({
            organizationId,
            tipo: TipoTransacaoPrisma.CREDITO,
            valor: t.amount,
            goldPrice,
            goldAmount,
            moeda: 'BRL',
            descricao: t.description
              ? `Transf. de ${sourceName}: ${t.description}`
              : `Transferência de ${sourceName}`,
            dataHora: dataHoraDate,
            contaContabilId,
            contaCorrenteId: destinationAccountId,
            linkedTransactionId: debitTx.id,
            fitId: null,
          });
          const creditTx = await this.transacaoRepository.create(creditEntity, tx);

          debitTx.linkTransaction(creditTx.id!);
          await this.transacaoRepository.update(debitTx, tx);
          createdCount += 2;
        } else {
          // Crédito na conta corrente importada (destino), Débito na conta origem (destinationAccountId)
          const creditEntity = TransacaoEntity.create({
            organizationId,
            tipo: TipoTransacaoPrisma.CREDITO,
            valor: t.amount,
            goldPrice,
            goldAmount,
            moeda: 'BRL',
            descricao: t.description || `Transferência de ${destName}`,
            dataHora: dataHoraDate,
            contaContabilId,
            contaCorrenteId: contaCorrenteId,
            fitId: t.fitId,
          });
          const creditTx = await this.transacaoRepository.create(creditEntity, tx);

          const debitEntity = TransacaoEntity.create({
            organizationId,
            tipo: TipoTransacaoPrisma.DEBITO,
            valor: t.amount,
            goldPrice,
            goldAmount,
            moeda: 'BRL',
            descricao: t.description
              ? `Transf. para ${sourceName}: ${t.description}`
              : `Transferência para ${sourceName}`,
            dataHora: dataHoraDate,
            contaContabilId,
            contaCorrenteId: destinationAccountId,
            linkedTransactionId: creditTx.id,
            fitId: null,
          });
          const debitTx = await this.transacaoRepository.create(debitEntity, tx);

          creditTx.linkTransaction(debitTx.id!);
          await this.transacaoRepository.update(creditTx, tx);
          createdCount += 2;
        }
      }

      return { count: createdCount };
    });
  }
}
