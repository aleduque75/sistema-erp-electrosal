import { Injectable, BadRequestException } from '@nestjs/common';
import { parseItauCreditCardStatement } from '../utils/pdf-parser';
import { PrismaService } from '../prisma/prisma.service';
import * as CryptoJS from 'crypto-js';
import { addMonths } from 'date-fns';

interface ParsedTransaction {
  date: string;
  description: string;
  value: number;
  installment?: string;
  contaContabilId: string;
  creditCardId: string;
}

function parseDate(dateString: string): Date {
  if (typeof dateString !== 'string') return new Date('invalid date');
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  if (/^\d{2}\/\d{2}$/.test(dateString)) {
    const [day, month] = dateString.split('/').map(Number);
    const currentYear = new Date().getFullYear();
    return new Date(currentYear, month - 1, day);
  }
  return new Date('invalid date');
}

@Injectable()
export class PdfImportService {
  constructor(private prisma: PrismaService) {}

  private generateFingerprint(transaction: {
    date: string;
    description: string;
    value: number;
    creditCardId: string;
    installment?: string;
  }): string {
    const transactionDate = parseDate(transaction.date);
    if (isNaN(transactionDate.getTime())) {
      throw new BadRequestException(
        `Formato de data inválido: "${transaction.date}"`,
      );
    }
    const standardizedDate = transactionDate.toISOString().split('T')[0];
    const dataToHash = [
      standardizedDate,
      transaction.description.toLowerCase().trim(),
      transaction.value.toFixed(2),
      transaction.creditCardId,
      transaction.installment || '',
    ].join('|');
    return CryptoJS.SHA256(dataToHash).toString();
  }

  async processTextStatement(plainText: string, organizationId: string) {
    return parseItauCreditCardStatement(plainText, organizationId);
  }

  async checkDuplicates(transactions: any[], organizationId: string) {
    const fingerprints = transactions.map((tx) => this.generateFingerprint(tx));
    const existingTransactions =
      await this.prisma.creditCardTransaction.findMany({
        where: {
          creditCard: { organizationId },
          fingerprint: { in: fingerprints },
        },
        select: { fingerprint: true },
      });
    const existingFingerprints = new Set(
      existingTransactions.map((tx) => tx.fingerprint),
    );
    return transactions.map((tx) => ({
      ...tx,
      isDuplicate: existingFingerprints.has(this.generateFingerprint(tx)),
    }));
  }

  async importTransactions(
    transactions: ParsedTransaction[],
    organizationId: string,
  ) {
    let createdCount = 0;
    for (const tx of transactions) {
      const fingerprint = this.generateFingerprint(tx);
      const existing = await this.prisma.creditCardTransaction.findUnique({
        where: { fingerprint },
      });
      if (existing) continue;

      const transactionDate = parseDate(tx.date);
      await this.prisma.creditCardTransaction.create({
        data: {
          creditCardId: tx.creditCardId,
          contaContabilId: tx.contaContabilId,
          description: tx.description,
          amount: tx.value,
          date: transactionDate,
          isInstallment: !!tx.installment,
          installments: tx.installment
            ? parseInt(tx.installment.split('/')[1], 10)
            : undefined,
          currentInstallment: tx.installment
            ? parseInt(tx.installment.split('/')[0], 10)
            : undefined,
          fingerprint: fingerprint,
        },
      });
      createdCount++;

      if (tx.installment) {
        const [current, total] = tx.installment.split('/').map(Number);
        if (current < total) {
          for (let i = current + 1; i <= total; i++) {
            const futureDate = addMonths(transactionDate, i - current);
            const futureDescription = tx.description.replace(
              ` ${current.toString().padStart(2, '0')}/${total.toString().padStart(2, '0')}`,
              ` ${i.toString().padStart(2, '0')}/${total.toString().padStart(2, '0')}`,
            );
            await this.prisma.creditCardTransaction.create({
              data: {
                creditCardId: tx.creditCardId,
                contaContabilId: tx.contaContabilId,
                description: futureDescription,
                amount: tx.value,
                date: futureDate,
                isInstallment: true,
                installments: total,
                currentInstallment: i,
              },
            });
            createdCount++;
          }
        }
      }
    }
    return { count: createdCount };
  }
}
