import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoMetal } from '@prisma/client';

@Injectable()
export class QuotationImportsService {
  constructor(private prisma: PrismaService) {}

  async importQuotationsFromJson(fileBuffer: Buffer, organizationId: string) {
    const itemsData = JSON.parse(fileBuffer.toString('utf-8'));

    let createdCount = 0;
    for (const item of itemsData) {
      const cotacao = parseFloat(item.cotacao.replace(',', '.'));
      if (isNaN(cotacao) || cotacao <= 0) {
        continue;
      }

      const itemDate = new Date(item['Creation Date']);
      const dateOnly = new Date(itemDate.toISOString().split('T')[0]);

      try {
        await this.prisma.quotation.create({
          data: {
            organizationId,
            metal: TipoMetal.AU,
            date: dateOnly,
            buyPrice: cotacao,
            sellPrice: cotacao,
          },
        });
        createdCount++;
      } catch (e: any) {
        if (e.code === 'P2002') {
          // Unique constraint violation, quotation for this date already exists.
        } else {
          console.error(`Failed to create quotation for item ${item['unique id']}:`, e);
        }
      }
    }
    return { createdCount };
  }
}
