import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Papa from 'papaparse';
import { Decimal } from '@prisma/client/runtime/library';
import { SaleInstallmentStatus, SaleStatus, EntityType } from '@prisma/client';
import { GenerateNextNumberUseCase } from '../common/use-cases/generate-next-number.use-case';
import { QuotationsService } from '../quotations/quotations.service';

// Removed unused SalesMovementRow interface to avoid "defined but never used" lint/compile error.

@Injectable()
export class SalesMovementImportUseCase {
  private readonly logger = new Logger(SalesMovementImportUseCase.name);

  constructor(private prisma: PrismaService, private readonly generateNextNumberUseCase: GenerateNextNumberUseCase, private readonly quotationsService: QuotationsService) {}

  private parseDecimal(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const cleanedValue = value.trim().replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(cleanedValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  async execute(fileBuffer: Buffer) {
    this.logger.log('Starting sales movement import process (v4 - Corrected Logic)...');
    const organizationId = '2a5bb448-056b-4b87-b02f-fec691dd658d'; // Hardcoded for Electrosal

    let csvData = fileBuffer.toString('utf-8');
    if (csvData.startsWith('\uFEFF')) {
      csvData = csvData.substring(1);
    }
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      delimiter: ';',
      transformHeader: (header) => {
        const trimmed = header.trim();
        if (trimmed === 'Nº DO LOTE') return 'N_DO_LOTE';
        if (trimmed === 'Nº DO PEDIDO') return 'N_DO_PEDIDO';
        if (trimmed === 'PEDIDOS EM SAL') return 'PEDIDOS_EM_SAL';
        if (trimmed === 'PEDIDOS EM FINO') return 'PEDIDOS_EM_FINO';
        if (trimmed.toLowerCase() === 'data') return 'data_row';
        return trimmed;
      },
    });

    if (parsed.errors.length) {
      this.logger.error('Errors parsing CSV file:', parsed.errors);
      throw new BadRequestException(
        'Erro ao ler o arquivo CSV. Verifique o formato.',
      );
    }

    const rows = parsed.data as Record<string, unknown>[];

    // --- ETAPA 1: IDENTIFICAR DADOS DE CRIAÇÃO DOS LOTES ---
    this.logger.log('--- ETAPA 1: Identificando dados de criação dos Lotes ---');
    const lotesCreationInfo = new Map<string, { creationGoldGrams: number, creationDate: Date }>();

    // Caso especial: Saldo inicial do lote 1094
    const lote1094InitialBalanceRow = rows.find(row => {
        const loteValue = row['N_DO_LOTE'];
        const estoqueFinoValue = row['ESTOQUE DE SAL EM FINO AU'];
        return (String(loteValue).trim() === '1094' && this.parseDecimal(String(estoqueFinoValue)) > 0 && !row['N_DO_PEDIDO']);
    });

    if (lote1094InitialBalanceRow) {
        const initialGold = this.parseDecimal(String(lote1094InitialBalanceRow['ESTOQUE DE SAL EM FINO AU']));
        const dateStr = String(lote1094InitialBalanceRow['DATA DA ENTREGA']);
        const dateParts = dateStr.split('/');
        const creationDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);

        lotesCreationInfo.set('1094', {
            creationGoldGrams: initialGold,
            creationDate: creationDate
        });
        this.logger.log(`Saldo inicial do Lote 1094 identificado: ${initialGold}g de ouro em ${creationDate.toISOString()}`);
    }

    for (const [index, row] of (rows as any[]).entries()) {
        const loteValue = row['N_DO_LOTE'];
        const lote = (typeof loteValue === 'string' || typeof loteValue === 'number') ? String(loteValue).trim() : undefined;
        const entradaFinoValue = row['ENTRADA DE SAL EM FINO'];
        const goldGrams = this.parseDecimal(typeof entradaFinoValue === 'string' || typeof entradaFinoValue === 'number' ? String(entradaFinoValue) : '0');

        if (!lote) continue;

        this.logger.log(`[DEBUG LOTE - Linha CSV ${index + 2}] Lote: ${lote}, GoldGrams: ${goldGrams}, Já existe no Map: ${lotesCreationInfo.has(lote)}`);

        if (goldGrams > 0) {
          if (!lotesCreationInfo.has(lote)) {
            let dateStr = String(row['DATA DA ENTREGA'] || '');
            let dateParts = dateStr.split('/');

            // Fallback para a coluna 'data' se a primeira estiver vazia ou for inválida
            if (dateParts.length !== 3) {
              dateStr = String(row['data'] || '');
              dateParts = dateStr.split('/');
            }

            if (dateParts.length === 3) {
                // Constrói a data assumindo que o ano atual é o correto se não especificado
                const day = dateParts[0];
                const month = dateParts[1];
                const year = dateParts[2] || new Date().getFullYear();
                const creationDate = new Date(`${year}-${month}-${day}`);

                lotesCreationInfo.set(lote, {
                    creationGoldGrams: goldGrams,
                    creationDate: creationDate
                });
                this.logger.log(`[DEBUG LOTE] Lote ${lote} ADICIONADO ao Map para criação.`);
            } else {
                this.logger.warn(`[DEBUG LOTE] Lote ${lote} tem data inválida: ${dateStr}`);
            }
          }
        }
    }

    // --- ETAPA 1.2: CRIAÇÃO DOS LOTES DE PRODUÇÃO COM BASE NOS DADOS CORRETOS ---
    this.logger.log('--- ETAPA 1.2: Criando Lotes de Produção com base nos dados corretos ---');

    const elSalProduct = await this.prisma.product.findFirst({
      where: { name: 'El Sal 68%' },
    });
    if (!elSalProduct) {
      throw new BadRequestException('Produto "El Sal 68%" não encontrado.');
    }

    let createdLotsCount = 0;
    for (const [loteNumber, info] of lotesCreationInfo.entries()) {
      const existingLot = await this.prisma.inventoryLot.findUnique({
        where: { batchNumber: loteNumber.toString() },
      });

      if (existingLot) {
        this.logger.log(`Lote ${loteNumber} já existe. Pulando criação.`);
        continue;
      }

      const inputGoldGrams = new Decimal(info.creationGoldGrams);
      const outputSaltGrams = inputGoldGrams.times(1.47);

      const reactionNumber = await this.generateNextNumberUseCase.execute(
        organizationId,
        EntityType.CHEMICAL_REACTION,
        'REA-',
        1,
      );

      const reaction = await this.prisma.chemical_reactions.create({
        data: {
          organizationId,
          reactionNumber,
          metalType: 'AU',
          status: 'COMPLETED',
          reactionDate: info.creationDate || new Date(),
          auUsedGrams: inputGoldGrams.toNumber(),
          inputGoldGrams: inputGoldGrams,
          outputGoldGrams: inputGoldGrams,
          outputProductGrams: outputSaltGrams.toNumber(),
          inputRawMaterialGrams: 0,
          outputProductId: elSalProduct.id,
          notes: `Reação simbólica para criação do lote ${loteNumber} via planilha (lógica corrigida).`,
        },
      });

      const newLot = await this.prisma.inventoryLot.create({
        data: {
          organizationId,
          productId: elSalProduct.id,
          batchNumber: loteNumber.toString(),
          quantity: outputSaltGrams.toNumber(),
          remainingQuantity: outputSaltGrams.toNumber(),
          costPrice: 0,
          sourceType: 'REACTION',
          sourceId: reaction.id,
          notes: `Lote criado via importação de planilha (lógica corrigida).`,
          reaction: { connect: { id: reaction.id } },
        },
      });

      await this.prisma.stockMovement.create({
        data: {
          organizationId,
          productId: elSalProduct.id,
          inventoryLotId: newLot.id,
          quantity: outputSaltGrams.toNumber(),
          type: 'LOT_CREATION',
          sourceDocument: `Criação Lote #${loteNumber}`,
          createdAt: reaction.reactionDate,
        },
      });

      createdLotsCount++;
      this.logger.log(`Lote ${loteNumber} criado com sucesso com ${outputSaltGrams.toNumber()}g de Sal.`);
    }

    // --- ETAPA 2: PROCESSAMENTO DAS VENDAS ---
    const notFoundSales = new Set<number>();
    let processedSalesCount = 0;

    // Fetch user settings for default accounts
    const userSettings = await this.prisma.userSettings.findFirst({
      where: {
        user: {
          organizationId: organizationId,
        },
      },
      select: { defaultReceitaContaId: true, defaultCaixaContaId: true },
    });

    if (!userSettings || !userSettings.defaultReceitaContaId || !userSettings.defaultCaixaContaId) {
      this.logger.warn('Contas padrão para recebimentos não configuradas nas UserSettings. Transações podem falhar.');
      // Optionally throw an error or use fallback logic
    }

    for (const row of rows) {
      const nDoPedidoValue = row['N_DO_PEDIDO'];
      const orderNumber = (typeof nDoPedidoValue === 'string' || typeof nDoPedidoValue === 'number') ? parseInt(String(nDoPedidoValue), 10) : NaN;
      const nDoLoteValue = row['N_DO_LOTE'];
      const loteNumber = (typeof nDoLoteValue === 'string' || typeof nDoLoteValue === 'number') ? String(nDoLoteValue) : undefined;
      
      const pedidosEmSalValue = row['PEDIDOS_EM_SAL'];
      const saltQty = new Decimal(this.parseDecimal(
        typeof pedidosEmSalValue === 'string' || typeof pedidosEmSalValue === 'number' ? String(pedidosEmSalValue) : '0',
      ));

      const pedidosEmFinoValue = row['PEDIDOS_EM_FINO'];
      const finoQty = new Decimal(this.parseDecimal(
        typeof pedidosEmFinoValue === 'string' || typeof pedidosEmFinoValue === 'number' ? String(pedidosEmFinoValue) : '0',
      ));

      if (!orderNumber || !loteNumber || saltQty.isZero() || finoQty.isZero()) {
        continue;
      }

      const sale = await this.prisma.sale.findUnique({
        where: { orderNumber },
        include: { saleItems: true },
      });

      if (!sale) {
        notFoundSales.add(orderNumber);
        continue;
      }

      // Update sale goldValue and totalCost
      const calculatedTotalCost = sale.saleItems.reduce((sum, item) => sum.plus(new Decimal(item.costPriceAtSale || 0).times(item.quantity)), new Decimal(0));

      await this.prisma.sale.update({
        where: { id: sale.id },
        data: { goldValue: finoQty, totalCost: calculatedTotalCost, netAmount: sale.totalAmount },
      });

      if (sale.status === SaleStatus.PENDENTE) {
        this.logger.log(`Venda #${orderNumber} está com status ABERTO. Pulando processamento de parcelas e baixa de estoque.`);
        continue;
      }

      const inventoryLot = await this.prisma.inventoryLot.findUnique({
        where: { batchNumber: loteNumber },
      });

      if (!inventoryLot) {
        this.logger.error(`Lote ${loteNumber} para a venda #${orderNumber} não encontrado. Impossível dar baixa.`);
        continue;
      }

      const saleItemToUpdate = sale.saleItems.find(
        (item) =>
          item.productId === inventoryLot.productId &&
          !item.inventoryLotId &&
          Math.abs(item.quantity - finoQty.toNumber()) < 0.001,
      );

      if (saleItemToUpdate) {
        await this.prisma.saleItem.update({
          where: { id: saleItemToUpdate.id },
          data: { inventoryLotId: inventoryLot.id },
        });
        this.logger.log(`SaleItem ${saleItemToUpdate.id} para a Venda #${sale.orderNumber} vinculado ao Lote ${inventoryLot.batchNumber}.`);
      } else {
        this.logger.warn(`Nenhum SaleItem compatível (produto, sem lote, quantidade) encontrado na Venda #${sale.orderNumber} para vincular ao lote ${loteNumber}.`);
      }

      const existingMovement = await this.prisma.stockMovement.findFirst({
        where: { sourceDocument: `Venda #${sale.orderNumber}` },
      });

      if (!existingMovement) {
        await this.prisma.stockMovement.create({
          data: {
            organizationId,
            productId: inventoryLot.productId,
            inventoryLotId: inventoryLot.id,
            quantity: saltQty.negated().toNumber(),
            type: 'SALE',
            sourceDocument: `Venda #${sale.orderNumber}`,
            createdAt: sale.createdAt,
          },
        });

        await this.prisma.inventoryLot.update({
          where: { id: inventoryLot.id },
          data: { remainingQuantity: { decrement: saltQty.toNumber() } },
        });
        this.logger.log(`Baixa de estoque para venda #${orderNumber} no lote ${loteNumber} realizada.`);
      }

      const installments = await this.prisma.saleInstallment.findMany({
        where: { saleId: sale.id, status: 'PENDING' },
        orderBy: { installmentNumber: 'asc' },
      });

      if (installments.length > 0) {
        const installmentToPay = installments[0];
        
        if (new Decimal(installmentToPay.amount).isZero()) {
            this.logger.warn(`Parcela #${installmentToPay.installmentNumber} da venda #${orderNumber} tem valor zero. Pulando conciliação.`);
        } else {
            const paymentDate = installmentToPay.dueDate;

            // Buscar cotação para a data do pagamento
            const quotation = await this.quotationsService.findByDate(
              paymentDate,
              'AU', // Assumindo que a transação é sempre em ouro
              organizationId,
            );

            let goldAmount = new Decimal(0);
            let goldPrice = new Decimal(0);

            if (quotation) {
              goldPrice = quotation.buyPrice;
              goldAmount = new Decimal(installmentToPay.amount).dividedBy(goldPrice);
            } else {
              this.logger.warn(`Cotação não encontrada para a data ${paymentDate.toISOString()} para a venda #${orderNumber}. goldAmount será 0.`);
            }

            await this.prisma.saleInstallment.update({
              where: { id: installmentToPay.id },
              data: { status: 'PAID', paidAt: paymentDate },
            });

            if (installmentToPay.accountRecId) {
              await this.prisma.accountRec.update({
                where: { id: installmentToPay.accountRecId },
                data: { received: true, receivedAt: paymentDate },
              });

              // Criar Transacao
              await this.prisma.transacao.create({
                data: {
                  organizationId,
                  tipo: 'CREDITO',
                  valor: new Decimal(installmentToPay.amount),
                  moeda: 'BRL',
                  descricao: `Pagamento Parcela ${installmentToPay.installmentNumber} Venda #${orderNumber}`,
                  dataHora: paymentDate,
                  contaContabilId: userSettings?.defaultReceitaContaId || 'default', // Usar ID da UserSettings
                  contaCorrenteId: userSettings?.defaultCaixaContaId || 'default', // Usar ID da UserSettings
                  goldAmount: goldAmount,
                  goldPrice: goldPrice,
                  accountRecId: installmentToPay.accountRecId,
                },
              });
            }
            this.logger.log(`Parcela #${installmentToPay.installmentNumber} da venda #${orderNumber} conciliada.`);
        }
      }

      processedSalesCount++;
    }

    const summary = `Processo concluído (v4). ${createdLotsCount} novos lotes criados. ${processedSalesCount} movimentações de venda processadas.`;
    this.logger.log(summary);

    if (notFoundSales.size > 0) {
      const warning = `Atenção: As seguintes vendas não foram encontradas: ${[...notFoundSales].join(', ')}`;
      this.logger.warn(warning);
      return { message: `${summary} ${warning}` };
    }

    return { message: summary };
  }
}
