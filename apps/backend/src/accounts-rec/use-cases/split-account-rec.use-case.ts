import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SplitAccountRecDto } from '../dtos/split-account-rec.dto';
import { Prisma, SaleInstallmentStatus } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class SplitAccountRecUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, id: string, dto: SplitAccountRecDto) {
    const accountRec = await this.prisma.accountRec.findFirst({
      where: { id, organizationId },
      include: {
        sale: {
          include: {
            installments: true,
          },
        },
        saleInstallments: true,
      },
    });

    if (!accountRec) {
      throw new NotFoundException('Conta a receber não encontrada.');
    }

    if (accountRec.received || Number(accountRec.amountPaid || 0) > 0) {
      throw new BadRequestException('Não é possível dividir um lançamento que já possui recebimento registrado.');
    }

    const originalAmount = new Decimal(accountRec.amount);
    const sumInstallments = dto.installments.reduce(
      (acc, item) => acc.plus(new Decimal(item.amount)),
      new Decimal(0),
    );

    const diff = sumInstallments.minus(originalAmount).abs();
    if (diff.greaterThan(0.01)) {
      throw new BadRequestException(
        `A soma das parcelas (R$ ${sumInstallments.toFixed(2)}) deve ser exatamente igual ao valor original (R$ ${originalAmount.toFixed(2)}).`,
      );
    }

    const totalCount = dto.installments.length;

    // Gerar descrição base limpa
    const cleanBaseDesc = accountRec.description
      .replace(/\s*-\s*Parcela\s*\d+\/\d+/gi, '')
      .replace(/\s*\(A Combinar\)/gi, '')
      .trim();

    return this.prisma.$transaction(async (tx) => {
      // 1. Atualizar a primeira parcela reaproveitando o AccountRec original
      const firstItem = dto.installments[0];
      const firstAmount = new Decimal(firstItem.amount).toDecimalPlaces(2);
      const firstRatio = firstAmount.dividedBy(originalAmount);
      const firstGoldAmount = accountRec.goldAmount
        ? new Decimal(accountRec.goldAmount).times(firstRatio).toDecimalPlaces(4)
        : null;

      const firstDesc =
        firstItem.description?.trim() || `${cleanBaseDesc} - Parcela 1/${totalCount}`;

      const updatedFirst = await tx.accountRec.update({
        where: { id: accountRec.id },
        data: {
          amount: firstAmount,
          dueDate: new Date(firstItem.dueDate),
          description: firstDesc,
          goldAmount: firstGoldAmount,
        },
      });

      const allAccounts = [updatedFirst];

      // 2. Criar as demais parcelas como novos AccountRec
      for (let i = 1; i < totalCount; i++) {
        const item = dto.installments[i];
        const itemAmount = new Decimal(item.amount).toDecimalPlaces(2);
        const ratio = itemAmount.dividedBy(originalAmount);
        const goldAmount = accountRec.goldAmount
          ? new Decimal(accountRec.goldAmount).times(ratio).toDecimalPlaces(4)
          : null;

        const desc =
          item.description?.trim() || `${cleanBaseDesc} - Parcela ${i + 1}/${totalCount}`;

        const created = await tx.accountRec.create({
          data: {
            organizationId,
            saleId: accountRec.saleId,
            contaCorrenteId: accountRec.contaCorrenteId,
            description: desc,
            amount: itemAmount,
            dueDate: new Date(item.dueDate),
            received: false,
            amountPaid: 0,
            goldAmount,
            goldAmountPaid: 0,
          },
        });

        allAccounts.push(created);
      }

      // 3. Atualizar ou criar SaleInstallments correspondentes caso vinculado a uma venda
      if (accountRec.saleId) {
        const existingSaleInstallments = await tx.saleInstallment.findMany({
          where: { saleId: accountRec.saleId },
          orderBy: { installmentNumber: 'asc' },
        });

        const linkedInstallment = existingSaleInstallments.find(
          (si) => si.accountRecId === accountRec.id,
        );

        if (linkedInstallment) {
          // Já existia uma parcela vinculada a este AccountRec
          await tx.saleInstallment.update({
            where: { id: linkedInstallment.id },
            data: {
              amount: allAccounts[0].amount,
              dueDate: allAccounts[0].dueDate,
              status: SaleInstallmentStatus.PENDING,
            },
          });

          // Criar parcelas para os novos AccountRec criados
          for (let i = 1; i < allAccounts.length; i++) {
            await tx.saleInstallment.create({
              data: {
                saleId: accountRec.saleId,
                installmentNumber: linkedInstallment.installmentNumber + i,
                amount: allAccounts[i].amount,
                dueDate: allAccounts[i].dueDate,
                status: SaleInstallmentStatus.PENDING,
                accountRecId: allAccounts[i].id,
              },
            });
          }

          // Re-ordenar numericamente todas as parcelas da venda por data de vencimento
          const allSaleInst = await tx.saleInstallment.findMany({
            where: { saleId: accountRec.saleId },
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
          });

          for (let idx = 0; idx < allSaleInst.length; idx++) {
            await tx.saleInstallment.update({
              where: { id: allSaleInst[idx].id },
              data: { installmentNumber: idx + 1 },
            });
          }
        } else if (existingSaleInstallments.length === 0) {
          // A venda não tinha nenhuma SaleInstallment (ex: venda "A Combinar" ou à vista com duplicata avulsa)
          // Criamos uma SaleInstallment para cada uma das parcelas agora
          for (let i = 0; i < allAccounts.length; i++) {
            await tx.saleInstallment.create({
              data: {
                saleId: accountRec.saleId,
                installmentNumber: i + 1,
                amount: allAccounts[i].amount,
                dueDate: allAccounts[i].dueDate,
                status: SaleInstallmentStatus.PENDING,
                accountRecId: allAccounts[i].id,
              },
            });
          }
        } else {
          // A venda já tinha outras parcelas, mas esta não estava vinculada
          const maxNum = Math.max(
            ...existingSaleInstallments.map((si) => si.installmentNumber),
            0,
          );
          for (let i = 0; i < allAccounts.length; i++) {
            await tx.saleInstallment.create({
              data: {
                saleId: accountRec.saleId,
                installmentNumber: maxNum + i + 1,
                amount: allAccounts[i].amount,
                dueDate: allAccounts[i].dueDate,
                status: SaleInstallmentStatus.PENDING,
                accountRecId: allAccounts[i].id,
              },
            });
          }

          // Re-ordenar por vencimento
          const allSaleInst = await tx.saleInstallment.findMany({
            where: { saleId: accountRec.saleId },
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
          });

          for (let idx = 0; idx < allSaleInst.length; idx++) {
            await tx.saleInstallment.update({
              where: { id: allSaleInst[idx].id },
              data: { installmentNumber: idx + 1 },
            });
          }
        }
      }

      return {
        message: `Lançamento dividido em ${totalCount} parcelas com sucesso.`,
        accounts: allAccounts,
      };
    });
  }
}
