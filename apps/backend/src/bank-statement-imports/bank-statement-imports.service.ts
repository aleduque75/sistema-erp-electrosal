import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ofx from 'ofx-js';

// Interface para definir o formato da resposta
export interface PreviewTransaction {
  fitId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  postedAt: Date;
  status: 'new' | 'duplicate';
}

@Injectable()
export class BankStatementImportsService {
  constructor(private prisma: PrismaService) {}

  async previewOfx(
    organizationId: string,
    fileBuffer: Buffer,
    contaCorrenteId: string,
  ): Promise<PreviewTransaction[]> {
    // Validação da conta corrente (continua igual)
    const contaCorrente = await this.prisma.contaCorrente.findFirst({
      where: { id: contaCorrenteId, organizationId },
    });
    if (!contaCorrente) {
      throw new BadRequestException('Conta corrente não encontrada.');
    }

    try {
      const parsedData = await ofx.parse(fileBuffer.toString());
      const transactionsFromFile =
        parsedData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;

      if (!transactionsFromFile || transactionsFromFile.length === 0) {
        return []; // Retorna array vazio se não houver transações
      }

      // 1. Extrai todos os FITIDs do arquivo
      const fitIdsFromFile = transactionsFromFile.map((t) => t.FITID);

      // 2. Busca no banco quais desses FITIDs já existem PARA ESTA CONTA
      const existingTransactions = await this.prisma.transacao.findMany({
        where: {
          contaCorrenteId: contaCorrenteId,
          fitId: {
            in: fitIdsFromFile,
          },
        },
        select: {
          fitId: true,
        },
      });
      const existingFitIds = new Set(existingTransactions.map((t) => t.fitId));

      // 3. Monta a lista de pré-visualização
      const previewList: PreviewTransaction[] = transactionsFromFile.map(
        (t) => {
          const amount = parseFloat(t.TRNAMT);
          const dateString = t.DTPOSTED.substring(0, 8);
          const postedAt = new Date(
            `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`,
          );

          return {
            fitId: t.FITID,
            type: amount > 0 ? 'CREDIT' : 'DEBIT',
            amount: Math.abs(amount),
            description: t.MEMO,
            postedAt,
            status: existingFitIds.has(t.FITID) ? 'duplicate' : 'new',
          };
        },
      );

      return previewList;
    } catch (error) {
      console.error('Erro ao processar arquivo OFX:', error);
      throw new BadRequestException('Arquivo OFX inválido ou mal formatado.');
    }
  }
}
