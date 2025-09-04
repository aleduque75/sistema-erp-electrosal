import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dtos/create-product.dto';
import { ConfirmImportXmlDto, ImportXmlDto } from './dtos/import-xml.dto';
import { Product } from '@prisma/client';
import * as xml2js from 'xml2js';
import { XmlImportLogsService } from '../xml-import-logs/xml-import-logs.service'; // Added

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private xmlImportLogsService: XmlImportLogsService, // Injected
  ) {}

  async importXmlAnalyze(organizationId: string, importXmlDto: ImportXmlDto) {
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsedXml = await parser.parseStringPromise(importXmlDto.xmlContent);
    const nfeProc = parsedXml.nfeProc;
    if (!nfeProc) throw new BadRequestException('XML de NF-e inválido.');

    const nfe = nfeProc.NFe.infNFe;
    const nfeKey = nfe.$.Id.replace('NFe', '');
    const productsFromXml = Array.isArray(nfe.det) ? nfe.det : [nfe.det];

    const existingProducts = await this.prisma.product.findMany({
      where: { organizationId },
    });
    const analyzedProducts = productsFromXml.map((item) => {
      const prod = item.prod;
      const existingProduct = existingProducts.find(
        (p) => p.name === prod.xProd || p.id === prod.cProd,
      );
      return {
        xmlName: prod.xProd,
        xmlPrice: parseFloat(prod.vUnCom),
        xmlStock: parseFloat(prod.qCom),
        status: existingProduct ? 'ASSOCIADO' : 'NOVO',
        matchedProductId: existingProduct?.id,
      };
    });

    return { products: analyzedProducts, nfeKey };
  }

  async importXml(
    organizationId: string,
    confirmImportDto: ConfirmImportXmlDto,
  ) {
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsedXml = await parser.parseStringPromise(
      confirmImportDto.xmlContent,
    );
    const nfeProc = parsedXml.nfeProc;
    if (!nfeProc) throw new BadRequestException('XML de NF-e inválido.');

    const nfe = nfeProc.NFe.infNFe;
    const nfeKey = nfe.$.Id.replace('NFe', '');

    const existingLog = await this.xmlImportLogsService.findByNfeKey(organizationId, nfeKey);
    if (existingLog) {
      throw new BadRequestException(
        'Este arquivo XML (NF-e) já foi importado.',
      );
    }

    const productsFromXml = Array.isArray(nfe.det) ? nfe.det : [nfe.det];
    const installments = nfe.cobr?.dup
      ? Array.isArray(nfe.cobr.dup)
        ? nfe.cobr.dup
        : [nfe.cobr.dup]
      : [];

    return this.prisma.$transaction(async (tx) => {
      for (const item of productsFromXml) {
        const prod = item.prod;
        const manualMatchId = confirmImportDto.manualMatches?.[prod.xProd];
        let existingProduct: Product | null = null;

        if (manualMatchId) {
          existingProduct = await tx.product.findUnique({
            where: { id: manualMatchId, organizationId },
          });
        } else {
          existingProduct = await tx.product.findFirst({
            where: { name: prod.xProd, organizationId },
          });
        }

        if (existingProduct) {
          await tx.product.update({
            where: { id: existingProduct.id },
            data: {
              stock: { increment: parseFloat(prod.qCom) },
              price: parseFloat(prod.vUnCom),
            },
          });
        } else {
          await tx.product.create({
            data: {
              name: prod.xProd,
              price: parseFloat(prod.vUnCom),
              stock: parseFloat(prod.qCom),
              organizationId,
            },
          });
        }
      }

      if (installments.length > 0) {
        for (const dup of installments) {
          await tx.accountPay.create({
            data: {
              description: `NF-e ${nfe.ide.nNF} - Parcela ${dup.nDup}`,
              amount: parseFloat(dup.vDup),
              dueDate: new Date(dup.dVenc),
              organizationId,
            },
          });
        }
      } else {
        const totalValue = parseFloat(nfe.total.ICMSTot.vNF);
        if (totalValue > 0) {
          await tx.accountPay.create({
            data: {
              description: `NF-e ${nfe.ide.nNF} - Valor Total`,
              amount: totalValue,
              dueDate: new Date(nfe.ide.dhEmi),
              organizationId,
            },
          });
        }
      }

      await this.xmlImportLogsService.create(organizationId, { nfeKey });
      return { message: 'Importação concluída com sucesso!' };
    });
  }

  async create(
    organizationId: string,
    data: CreateProductDto,
  ): Promise<Product> {
    return this.prisma.product.create({ data: { ...data, organizationId } });
  }

  async findAll(organizationId: string): Promise<Product[]> {
    return this.prisma.product.findMany({ where: { organizationId } });
  }

  async findOne(organizationId: string, id: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId },
    });
    if (!product)
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    return product;
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateProductDto,
  ): Promise<Product> {
    await this.findOne(organizationId, id);
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(organizationId: string, id: string): Promise<Product> {
    await this.findOne(organizationId, id);
    return this.prisma.product.delete({ where: { id } });
  }
}
