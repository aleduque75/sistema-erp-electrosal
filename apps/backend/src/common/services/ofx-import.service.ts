import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIClassificationService } from './ai-classification.service';
import * as OFX from 'ofx-js';

@Injectable()
export class OfxImportService {
  private readonly logger = new Logger(OfxImportService.name);
  constructor(
    private prisma: PrismaService,
    private ai: AIClassificationService
  ) {}

  async importOfxFile(fileBuffer: Buffer, contaCorrenteId: string, enableAI: boolean, delay: number) {
    const ofxString = fileBuffer.toString('utf-8');
    const data = OFX.parse(ofxString);
    const transactions = data.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;

    let imported = 0;
    for (const trn of transactions) {
      const fitId = trn.FITID.toString();
      
      // Evita duplicata com upsert
      await this.prisma.transacao.upsert({
        where: { fitId },
        update: {},
        create: {
          fitId,
          contaCorrenteId,
          data: new Date(), // Ideal converter a data do OFX aqui
          descricao: trn.NAME || trn.MEMO,
          valor: parseFloat(trn.TRNAMT),
          tipo: parseFloat(trn.TRNAMT) > 0 ? 'CREDITO' : 'DEBITO',
          status: 'ATIVA',
        }
      });
      imported++;
      if (enableAI) await new Promise(r => setTimeout(r, delay));
    }
    return { total: imported };
  }
}
