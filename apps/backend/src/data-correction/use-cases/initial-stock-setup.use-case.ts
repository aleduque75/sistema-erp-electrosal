import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TipoMetal, PureMetalLotStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';

@Injectable()
export class InitialStockSetupUseCase {
  private readonly logger = new Logger(InitialStockSetupUseCase.name);

  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, tecgalvanoGrams: number) {
    this.logger.log('--- INICIANDO SETUP INICIAL DE ESTOQUE ---');

    try {
      // 1. Atualizar o saldo do lote 1183
      const lot1183 = await this.prisma.inventoryLot.findUnique({
        where: { batchNumber: '1183' },
      });

      if (lot1183) {
        await this.prisma.inventoryLot.update({
          where: { id: lot1183.id },
          data: { remainingQuantity: 44.63 },
        });
        this.logger.log('Saldo do lote 1183 atualizado para 44.63g.');
      } else {
        this.logger.warn('Lote 1183 não encontrado. Não foi possível atualizar o saldo.');
      }

      // 2. Criar pure_metal_lots iniciais
      const initialMetalLots = [
        { name: 'Bsa', grams: 500 },
        { name: 'Amon', grams: 31 },
        { name: 'Tecgalvano', grams: tecgalvanoGrams }, // Quantity from user
      ];

      for (const metalLot of initialMetalLots) {
        if (metalLot.grams <= 0) {
          this.logger.warn(`Quantidade inválida para ${metalLot.name}. Pulando.`);
          continue;
        }

        // Check if a similar lot already exists to avoid duplicates on re-run
        const existingPureMetalLot = await this.prisma.pure_metal_lots.findFirst({
          where: {
            organizationId,
            sourceType: 'INITIAL_SETUP',
            notes: { contains: metalLot.name },
          },
        });

        if (existingPureMetalLot) {
          this.logger.log(`Lote de metal puro para ${metalLot.name} já existe. Pulando criação.`);
          continue;
        }

        await this.prisma.pure_metal_lots.create({
          data: {
            organizationId,
            sourceType: 'INITIAL_SETUP',
            sourceId: 'N/A', // No specific source ID for initial setup
            metalType: TipoMetal.AU,
            initialGrams: metalLot.grams,
            remainingGrams: metalLot.grams,
            purity: 1, // Assuming pure gold
            status: PureMetalLotStatus.AVAILABLE,
            entryDate: new Date('2024-12-01T00:00:00Z'), // Default date for 12/2024
            notes: `Lote inicial de ${metalLot.name} via setup.`, // Use name in notes
          },
        });
        this.logger.log(`Lote de metal puro para ${metalLot.name} (${metalLot.grams}g) criado.`);
      }

      const finalMessage = 'Setup inicial de estoque concluído com sucesso!';
      this.logger.log(finalMessage);
      return { message: finalMessage };

    } catch (error) {
      this.logger.error('Ocorreu um erro durante o setup inicial de estoque.', error.stack);
      throw new Error(`Falha no setup inicial: ${error.message}`);
    }
  }
}
