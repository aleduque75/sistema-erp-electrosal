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

    if (!fs.existsSync(salesFilePath) || !fs.existsSync(saleItemsFilePath) || !fs.existsSync(financeiroFilePath)) {
      throw new BadRequestException('Arquivos pedidos.json, pedidoItens.json ou financeiro.json não encontrados no diretório especificado.');
    }

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



    const cotacoesMap = new Map<string, number>();
    oldFinanceiro.forEach(item => {
      const pedidoNumero = (item.pedidoDuplicata || item.duplicata)?.trim();
      if (pedidoNumero && item.cotacao) {
        const cotacaoValue = this.parseNumber(item.cotacao);
        cotacoesMap.set(pedidoNumero, cotacaoValue);
      }
    });

    const results: { saleNumber: string; status: string; reason?: string; newSaleId?: string }[] = [];

    for (const oldSale of oldSales) {
      try {
        const clienteExternalId = oldSale.clienteExternalId?.trim();
        // 1. Buscar o cliente pelo externalId.
        const pessoa = await this.prisma.pessoa.findFirst({
          where: {
            organizationId: organizationId,
            externalId: clienteExternalId,
          },
        });


        if (!pessoa) {
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
              } else {
                itemQuantity = this.parseNumber(oldItem.quantidadeAu || oldItem.quantidade || '1');
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
        } else {
          saleGoldQuote = cotacoesMap.get(oldSale.numero);
        }

        if (saleGoldQuote) {
          createSaleDto.goldQuoteValue = saleGoldQuote; // Adicionar ao DTO se encontrada
        } else if (oldSale.valorTotal && oldSale.valorTotalAu && this.parseNumber(oldSale.valorTotalAu) > 0) {
          const calculatedQuote = new Decimal(this.parseNumber(oldSale.valorTotal)).dividedBy(this.parseNumber(oldSale.valorTotalAu)).toFixed(2);
          createSaleDto.goldQuoteValue = parseFloat(calculatedQuote);
        } else {
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
        results.push({ saleNumber: oldSale.numero, status: 'failed', reason: error.message });
      }
    }

    return results;
  }
}