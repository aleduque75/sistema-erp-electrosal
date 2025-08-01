import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from './dtos/product.dto';
import { parseStringPromise } from 'xml2js';
import { AuditLogService } from '../common/audit-log.service';

// Interfaces para a resposta da análise
interface AnalyzedProduct {
  xmlName: string;
  xmlPrice: number;
  xmlStock: number;
  status: 'MATCHED' | 'NEW';
  matchedProductId?: string;
}
interface PayablePreview {
  description: string;
  amount: number;
  dueDate: Date;
}

interface NFe {
  infNFe: {
    det: {
      prod: {
        xProd: string[];
        vUnCom: string[];
        qCom: string[];
      }[];
    }[];
    cobr: {
      dup: {
        nDup: string[];
        vDup: string[];
        dVenc: string[];
      }[];
    }[];
    emit: {
      xNome: string[];
    }[];
    ide: {
      nNF: string[];
    }[];
  }[];
}

interface NFeProc {
  nfeProc: {
    NFe: NFe[];
    protNFe: {
      infProt: {
        chNFe: string[];
      }[];
    }[];
  };
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService, private auditLogService: AuditLogService) {}

  async create(userId: string, data: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({ data: { ...data, userId } });
  }

  async findAll(userId: string): Promise<Product[]> {
    return this.prisma.product.findMany({ where: { userId } });
  }

  async findOne(userId: string, id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id, userId },
    });
    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }
    return product;
  }

  async update(
    userId: string,
    id: string,
    data: UpdateProductDto,
  ): Promise<Product> {
    await this.findOne(userId, id);
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(userId: string, id: string): Promise<Product> {
    await this.findOne(userId, id);
    const saleItemCount = await this.prisma.saleItem.count({
      where: { productId: id },
    });
    if (saleItemCount > 0) {
      throw new ConflictException(
        'Este produto não pode ser removido pois está associado a vendas existentes.',
      );
    }
    const deletedProduct = await this.prisma.product.delete({ where: { id } });
    this.auditLogService.logDeletion(
      userId,
      'Product',
      deletedProduct.id,
      deletedProduct.name, // Passando o nome do produto como entityName
      `Produto ${deletedProduct.name} excluído.`,
    );
    return deletedProduct;
  }

  async analyzeXml(
    userId: string,
    xmlContent: string,
  ): Promise<{
    products: AnalyzedProduct[];
    payables: PayablePreview[];
    nfeKey: string;
  }> {
    let result: NFeProc;
    try {
      result = (await parseStringPromise(xmlContent)) as NFeProc;
    } catch {
      throw new BadRequestException('XML inválido ou em formato inesperado.');
    }
    const nfeKey = result.nfeProc.protNFe[0].infProt[0].chNFe[0];
    const existingLog = await this.prisma.xmlImportLog.findUnique({
      where: { nfeKey },
    });
    if (existingLog) {
      throw new ConflictException(
        'Este arquivo XML (NF-e) já foi importado anteriormente.',
      );
    }
    const nfeData = result.nfeProc.NFe[0].infNFe[0];
    const productsData = nfeData.det;
    const productNamesFromXml = productsData.map(
      (item) => item.prod[0].xProd[0],
    );
    const existingProducts = await this.prisma.product.findMany({
      where: { userId, name: { in: productNamesFromXml } },
      select: { id: true, name: true },
    });
    const existingProductsMap = new Map(
      existingProducts.map((p) => [p.name, p]),
    );
    const analyzedProducts: AnalyzedProduct[] = productsData.map((item) => {
      const name = item.prod[0].xProd[0];
      const existingProduct = existingProductsMap.get(name);
      return {
        xmlName: name,
        xmlPrice: parseFloat(item.prod[0].vUnCom[0]),
        xmlStock: parseInt(item.prod[0].qCom[0]),
        status: existingProduct ? 'MATCHED' : 'NEW',
        matchedProductId: existingProduct?.id,
      };
    });
    const payablesPreview: PayablePreview[] = [];
    const cobranca = nfeData.cobr?.[0];
    if (cobranca && cobranca.dup) {
      const fornecedor = nfeData.emit[0].xNome[0];
      const numeroNota = nfeData.ide[0].nNF[0];
      for (const parcela of cobranca.dup) {
        payablesPreview.push({
          description: `Pagamento Fornecedor ${fornecedor} - NF ${numeroNota} - Parcela ${parcela.nDup[0]}`,
          amount: parseFloat(parcela.vDup[0]),
          dueDate: new Date(parcela.dVenc[0]),
        });
      }
    }
    return { products: analyzedProducts, payables: payablesPreview, nfeKey };
  }

  async importXml(
    userId: string,
    xmlContent: string,
    manualMatches: { [xmlName: string]: string },
  ): Promise<Product[]> {
    let result: NFeProc;
    try {
      result = (await parseStringPromise(xmlContent)) as NFeProc;
    } catch {
      throw new BadRequestException('XML inválido ou em formato inesperado.');
    }
    const nfeData = result.nfeProc.NFe[0].infNFe[0];
    const nfeKey = result.nfeProc.protNFe[0].infProt[0].chNFe[0];
    const existingLog = await this.prisma.xmlImportLog.findUnique({
      where: { nfeKey },
    });
    if (existingLog) {
      throw new ConflictException(
        'Este arquivo XML (NF-e) já foi importado anteriormente.',
      );
    }
    const productsData = nfeData.det;
    return this.prisma.$transaction(async (tx) => {
      const productPromises: Promise<Product>[] = [];
      for (const item of productsData) {
        const xmlName = item.prod[0].xProd[0];
        const xmlPrice = parseFloat(item.prod[0].vUnCom[0]);
        const xmlStock = parseInt(item.prod[0].qCom[0]);
        const targetProductId = manualMatches[xmlName];
        if (targetProductId) {
          productPromises.push(
            tx.product.update({
              where: { id: targetProductId },
              data: { stock: { increment: xmlStock }, price: xmlPrice },
            }),
          );
        } else {
          const existingProduct = await tx.product.findFirst({
            where: { userId, name: xmlName },
          });
          if (existingProduct) {
            productPromises.push(
              tx.product.update({
                where: { id: existingProduct.id },
                data: { stock: { increment: xmlStock }, price: xmlPrice },
              }),
            );
          } else {
            productPromises.push(
              tx.product.create({
                data: {
                  userId,
                  name: xmlName,
                  price: xmlPrice,
                  stock: xmlStock,
                  description: 'Importado via NF-e',
                },
              }),
            );
          }
        }
      }
      const importedProducts = await Promise.all(productPromises);
      const cobranca = nfeData.cobr?.[0];
      if (cobranca && cobranca.dup) {
        const fornecedor = nfeData.emit[0].xNome[0];
        const numeroNota = nfeData.ide[0].nNF[0];
        for (const parcela of cobranca.dup) {
          await tx.accountPay.create({
            data: {
              userId,
              description: `Pagamento Fornecedor ${fornecedor} - NF ${numeroNota} - Parcela ${parcela.nDup[0]}`,
              amount: parseFloat(parcela.vDup[0]),
              dueDate: new Date(parcela.dVenc[0]),
              paid: false,
            },
          });
        }
      }
      await tx.xmlImportLog.create({ data: { nfeKey, userId } });
      return importedProducts;
    });
  }
}
