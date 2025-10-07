import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { SaleStatus } from '@prisma/client';

interface LegacyReceivable {
  aberto: string;
  pedidoDuplicata: string;
  'unique id': string;
}

interface LegacyPayment {
  baixaPagamento: string;
  duplicata: string;
  'unique id': string;
  contaCorrente: string;
}

@Injectable()
export class ReconcileLegacySalesUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string): Promise<{ reconciled: number; notFound: number; alreadyDone: number }> {
    const basePath = '/home/aleduque/Documentos/cursos/sistema-erp-electrosal/json-imports';
    const receivablesPath = path.join(basePath, 'pedido-duplicatas.json');
    const paymentsPath = path.join(basePath, 'financeiro.json');

    const receivablesFile = fs.readFileSync(receivablesPath, 'utf-8');
    const paymentsFile = fs.readFileSync(paymentsPath, 'utf-8');

    const legacyReceivables: LegacyReceivable[] = JSON.parse(receivablesFile);
    const legacyPayments: LegacyPayment[] = JSON.parse(paymentsFile);

    // Create a map for quick lookup
    const receivableMap = new Map<string, string>(); // Map duplicata_id -> account_rec_external_id
    for (const rec of legacyReceivables) {
      if (rec.aberto === 'não') {
        receivableMap.set(rec.pedidoDuplicata, rec['unique id']);
      }
    }

    let reconciled = 0;
    let notFound = 0;
    let alreadyDone = 0;

    // Fetch all ContaCorrente to map names to IDs
    const contasCorrentes = await this.prisma.contaCorrente.findMany({
      where: { organizationId },
    });
    const contaCorrenteMap = new Map<string, string>(); // Map name -> id
    for (const cc of contasCorrentes) {
      contaCorrenteMap.set(cc.nome, cc.id);
    }

    for (const payment of legacyPayments) {
      if (payment.baixaPagamento !== 'sim' || !payment.duplicata) {
        continue;
      }

      const accountRecExternalId = receivableMap.get(payment.duplicata);
      if (!accountRecExternalId) {
        continue; // This payment does not correspond to a closed receivable
      }

      // Resolve contaCorrenteId from name
      const expectedContaCorrenteId = contaCorrenteMap.get(payment.contaCorrente);
      if (!expectedContaCorrenteId) {
        notFound++; // ContaCorrente name from JSON not found in DB
        continue;
      }

      // Find the AccountRec and Transacao in the new system
      const accountRec = await this.prisma.accountRec.findUnique({
        where: { externalId: accountRecExternalId },
        include: { sale: true },
      });

      const transacao = await this.prisma.transacao.findFirst({
        where: {
          fitId: payment['unique id'], // Assuming 'unique id' maps to fitId
          contaCorrenteId: expectedContaCorrenteId,
          organizationId,
        },
      });

      if (!accountRec || !transacao) {
        notFound++;
        continue; // Corresponding records not found in the new DB
      }

      if (accountRec.received || accountRec.sale?.status !== SaleStatus.PENDENTE) {
        alreadyDone++;
        continue; // Already reconciled
      }

      // Perform the reconciliation
      await this.prisma.$transaction(async (tx) => {
        await tx.accountRec.update({
          where: { id: accountRec.id },
          data: {
            received: true,
            receivedAt: transacao.dataHora,
            transacaoId: transacao.id,
            contaCorrenteId: transacao.contaCorrenteId,
          },
        });

        if (accountRec.saleId) {
          await tx.sale.update({
            where: { id: accountRec.saleId },
            data: { status: SaleStatus.CONFIRMADO },
          });
        }
      });

      reconciled++;
    }

    return { reconciled, notFound, alreadyDone };
  }
}
