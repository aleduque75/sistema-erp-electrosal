import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleUseCase } from '../sales/use-cases/create-sale.use-case';
import { CreateSaleDto } from '../sales/dtos/sales.dto'; // Adicionar esta linha
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'date-fns';
import Decimal from 'decimal.js';

interface OldSaleData {
  baixaEstoque: string;
  cliente: string;
  correioPdf: string;
  cotacao: string;
  data: string;
  duplicatasPedido: string;
  emAberto: string;
  empresaTipo: string;
  fatorSal: string;
  numero: string;
  observacao: string;
  pedidoDuplicata: string;
  pedidoExcluido: string;
  pedidoItem: string;
  pedidoNumero: string;
  pedidoPdf: string;
  prazoPagamento: string;
  quantidade: string;
  quantidadeAu: string;
  quantidadeSal: string;
  representante: string;
  sedex: string;
  sedexDestinatarioSal: string;
  tipoProduto: string;
  valorFrete: string;
  valorMercadoria: string;
  valorTotal: string;
  valorTotalAu: string;
  valorTotalSal: string;
  'Creation Date': string;
  'Modified Date': string;
  Slug: string;
  Creator: string;
  'unique id': string; // externalId for the sale
  clienteExternalId?: string; // Adicionado
}

interface OldSaleItemData {
  comissaoAu: string;
  cotacao: string;
  empresaTipo: string;
  fator: string;
  lucroAu: string;
  lucroReal: string;
  maoDeObra: string;
  numeroItem: string; // Corresponds to OldSaleData.numero
  pedido: string; // Corresponds to OldSaleData.numero
  porcComissao: string;
  produto: string;
  quantidade: string;
  quantidadeAu: string;
  quantidadeSal: string;
  tipoProduto: string;
  valorTotalAu: string;
  valorTotalReal: string;
  valorTotalSal: string;
  valorUnitario: string;
  'Creation Date': string;
  'Modified Date': string;
  Slug: string;
  Creator: string;
  'unique id': string; // externalId for the sale item
}

interface OldFinanceiroData {
  cotacao: string;
  duplicata: string;
  pedidoDuplicata: string;
  // Adicione outros campos relevantes se necessário
}

@Injectable()
export class ImportSalesUseCase {
  constructor(
    private prisma: PrismaService,
    private createSaleUseCase: CreateSaleUseCase,
  ) {}

  private parseNumber(value: string): number {
    if (!value) return 0;
    // Substitui vírgula por ponto para parsear como float
    return parseFloat(value.replace(',', '.'));
  }

  private parseDate(dateString: string): Date {
    // Exemplo: "Nov 3, 2020 12:00 am"
    // O formato pode variar, então é importante testar
    const parsedDate = parse(dateString, 'MMM d, yyyy h:mm a', new Date());
    return parsedDate;
  }

  async execute(organizationId: string, userId: string, jsonDirectory: string): Promise<any> {
    const salesFilePath = path.join(jsonDirectory, 'pedidos_com_externalId_cliente.json');
    const saleItemsFilePath = path.join(jsonDirectory, 'pedidoItens.json');
    const financeiroFilePath = path.join(jsonDirectory, 'financeiro.json'); // Adicionado
    console.log(`[DEBUG ARQUIVO] Caminho do financeiro.json: ${financeiroFilePath}`);

    if (!fs.existsSync(salesFilePath) || !fs.existsSync(saleItemsFilePath) || !fs.existsSync(financeiroFilePath)) {
      throw new BadRequestException('Arquivos pedidos.json, pedidoItens.json ou financeiro.json não encontrados no diretório especificado.');
    }
    console.log(`[DEBUG ARQUIVO] financeiro.json existe.`);

    const oldSales: OldSaleData[] = JSON.parse(fs.readFileSync(salesFilePath, 'utf8'));
    const oldSaleItems: OldSaleItemData[] = JSON.parse(fs.readFileSync(saleItemsFilePath, 'utf8'));
    const oldFinanceiro: OldFinanceiroData[] = JSON.parse(fs.readFileSync(financeiroFilePath, 'utf8')); // Carregar financeiro.json

    // Find or create the legacy lot
    const reactionProduct = await this.prisma.product.findFirst({
        where: {
            organizationId: organizationId,
            name: {
                contains: '68',
            },
            productGroup: {
                isReactionProductGroup: true,
            },
        },
    });

    if (!reactionProduct) {
        throw new Error('Reaction product (like Sal 68%) not found for associating with the legacy lot.');
    }

    let legacyLot = await this.prisma.inventoryLot.findUnique({
        where: {
            batchNumber: 'LOTE-LEGADO-VENDAS',
        },
    });

    if (!legacyLot) {
        legacyLot = await this.prisma.inventoryLot.create({
            data: {
                organizationId: organizationId,
                productId: reactionProduct.id,
                batchNumber: 'LOTE-LEGADO-VENDAS',
                costPrice: new Decimal(0),
                quantity: 999999,
                remainingQuantity: 999999,
                sourceType: 'MIGRATION',
                sourceId: 'SCRIPT-IMPORT-SALES',
                notes: 'Virtual lot to associate with sale items imported from the old system.',
            },
        });
    }


    console.log(`[DEBUG ARQUIVO] financeiro.json lido e parseado. Total de itens: ${oldFinanceiro.length}`);

    const cotacoesMap = new Map<string, number>();
    oldFinanceiro.forEach(item => {
      const pedidoNumero = (item.pedidoDuplicata || item.duplicata)?.trim();
      if (pedidoNumero && item.cotacao) {
        const cotacaoValue = this.parseNumber(item.cotacao);
        cotacoesMap.set(pedidoNumero, cotacaoValue);
        console.log(`[DEBUG COTAÇÃO] Mapeando pedido ${pedidoNumero} com cotação ${cotacaoValue}`);
      }
    });
    console.log(`[DEBUG COTAÇÃO] cotacoesMap finalizado. Tamanho: ${cotacoesMap.size}. Primeiras 5 entradas:`, Array.from(cotacoesMap.entries()).slice(0, 5));

    const results: { saleNumber: string; status: string; reason?: string; newSaleId?: string }[] = [];

    for (const oldSale of oldSales) {
      try {
        const clienteExternalId = oldSale.clienteExternalId?.trim();
        console.log(`[DEBUG VENDA] Processando venda ${oldSale.numero}. Cliente: ${oldSale.cliente}, ExternalId Cliente: ${clienteExternalId}`);
        // 1. Buscar o cliente pelo externalId.
        const pessoa = await this.prisma.pessoa.findFirst({
          where: {
            organizationId: organizationId,
            externalId: clienteExternalId,
          },
        });

        console.log('[DEBUG IMPORT-SALES] pessoa:', pessoa); // Add this line

        if (!pessoa) {
          console.warn(`Cliente com externalId "${clienteExternalId}" (nome: "${oldSale.cliente}") não encontrado. Pulando venda ${oldSale.numero}.`);
          results.push({ saleNumber: oldSale.numero, status: 'skipped', reason: 'Cliente não encontrado' });
          continue;
        }

        // 2. Mapear os itens da venda antiga para a estrutura de CreateSaleDto
        const itemsForSale = await Promise.all(
          oldSaleItems
            .filter(item => item.pedido === oldSale.numero)
            .map(async (oldItem: OldSaleItemData) => { // Adicionado o tipo para oldItem
              const product = await this.prisma.product.findFirst({
                where: {
                  organizationId,
                  name: oldItem.produto,
                },
                include: { productGroup: true },
              });

              if (!product) {
                throw new NotFoundException(`Produto "${oldItem.produto}" não encontrado para importação.`);
              }

              let itemQuantity: number;
              if (oldItem.produto.trim().toLowerCase().includes('sal 68%')) {
                itemQuantity = this.parseNumber(oldItem.quantidadeSal || oldItem.quantidade || '1');
                console.log(`[DEBUG IMPORT] Produto: ${oldItem.produto}, (Explicit Sal 68% - includes) quantidadeSal: ${oldItem.quantidadeSal}, itemQuantity: ${itemQuantity}`);
              } else {
                itemQuantity = this.parseNumber(oldItem.quantidadeAu || oldItem.quantidade || '1');
                console.log(`[DEBUG IMPORT] Produto: ${oldItem.produto}, (Other Product) quantidadeAu: ${oldItem.quantidadeAu}, itemQuantity: ${itemQuantity}`);
              }

              const price = new Decimal(this.parseNumber(oldItem.valorTotalReal)).dividedBy(itemQuantity);

              return {
                productId: product.id,
                quantity: itemQuantity,
                price: price,
                externalId: oldItem['unique id'], // Mapear externalId para SaleItem
              };
            })
        );

        if (itemsForSale.length === 0) {
          console.warn(`Nenhum item encontrado para a venda ${oldSale.numero}. Pulando.`);
          results.push({ saleNumber: oldSale.numero, status: 'skipped', reason: 'Nenhum item encontrado' });
          continue;
        }

        const createSaleDto: CreateSaleDto = { // Adicionada tipagem explícita
          pessoaId: pessoa.id,
          items: itemsForSale.map(mappedItem => ({
            productId: mappedItem.productId,
            quantity: mappedItem.quantity,
            price: mappedItem.price.toNumber(),
            externalId: mappedItem.externalId, // Acessar de mappedItem.externalId
            lots: [{ inventoryLotId: legacyLot.id, quantity: mappedItem.quantity }],
          })),
          paymentMethod: 'IMPORTADO', // Pode ser mapeado de oldSale se houver um campo
          numberOfInstallments: 1, // Assumindo 1 parcela para vendas antigas
          feeAmount: this.parseNumber(oldSale.valorFrete),
          // paymentTermId: undefined, // Deixar undefined por enquanto
          // contaCorrenteId: undefined, // Deixar undefined por enquanto
        };

        let saleGoldQuote: number | undefined;

        if (oldSale.cotacao && this.parseNumber(oldSale.cotacao) > 0) {
          saleGoldQuote = this.parseNumber(oldSale.cotacao);
          console.log(`[DEBUG Cotação] Venda ${oldSale.numero}: Cotação encontrada diretamente em oldSale.cotacao: ${saleGoldQuote}`);
        } else {
          saleGoldQuote = cotacoesMap.get(oldSale.numero);
          console.log(`[DEBUG COTAÇÃO] Venda ${oldSale.numero}: Cotação encontrada no map: ${saleGoldQuote}`);
        }

        if (saleGoldQuote) {
          createSaleDto.goldQuoteValue = saleGoldQuote; // Adicionar ao DTO se encontrada
          console.log(`[DEBUG Cotação] Venda ${oldSale.numero}: goldQuoteValue adicionado ao DTO: ${createSaleDto.goldQuoteValue}`);
        } else if (oldSale.valorTotal && oldSale.valorTotalAu && this.parseNumber(oldSale.valorTotalAu) > 0) {
          const calculatedQuote = new Decimal(this.parseNumber(oldSale.valorTotal)).dividedBy(this.parseNumber(oldSale.valorTotalAu)).toFixed(2);
          createSaleDto.goldQuoteValue = parseFloat(calculatedQuote);
          console.log(`[DEBUG Cotação] Venda ${oldSale.numero}: Cotação calculada a partir de valorTotal/valorTotalAu: ${createSaleDto.goldQuoteValue}`);
        } else {
          console.warn(`[DEBUG Cotação] Venda ${oldSale.numero}: Nenhuma cotação encontrada ou calculável para este pedido.`);
        }

        // 3. Chamar o CreateSaleUseCase para criar a venda
        const createdSale = await this.createSaleUseCase.execute(
          organizationId,
          userId, // O userId do usuário que está realizando a importação
          {
            ...createSaleDto,
            externalId: oldSale['unique id'], // Mapear externalId para Sale
          } as any, // Cast temporário, ajustar DTO
        );

        results.push({ saleNumber: oldSale.numero, status: 'success', newSaleId: createdSale.id });
      } catch (error) {
        console.error(`Erro ao importar venda ${oldSale.numero}:`, error.message);
        results.push({ saleNumber: oldSale.numero, status: 'failed', reason: error.message });
      }
    }

    return results;
  }
}
