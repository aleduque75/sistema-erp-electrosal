import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dtos/create-product.dto';
import { ConfirmImportXmlDto, ImportXmlDto } from './dtos/import-xml.dto';
import { Product } from '@sistema-erp-electrosal/core'; // Changed
import { ProductMapper } from './mappers/product.mapper'; // Added
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

    const existingProducts = (await this.prisma.product.findMany({
      where: { organizationId },
    })).map(ProductMapper.toDomain); // Map to DDD entity
    const analyzedProducts = productsFromXml.map((item) => {
      const prod = item.prod;
      const existingProduct = existingProducts.find(
        (p) => p.name === prod.xProd || p.id.toString() === prod.cProd, // Use id.toString()
      );
      return {
        xmlName: prod.xProd,
        xmlPrice: parseFloat(prod.vUnCom),
        xmlStock: parseFloat(prod.qCom),
        status: existingProduct ? 'ASSOCIADO' : 'NOVO',
        matchedProductId: existingProduct?.id.toString(), // Use id.toString()
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
          const prismaProduct = await tx.product.findUnique({
            where: { id: manualMatchId, organizationId },
          });
          existingProduct = prismaProduct ? ProductMapper.toDomain(prismaProduct) : null;
        } else {
          const prismaProduct = await tx.product.findFirst({
            where: { name: prod.xProd, organizationId },
          });
          existingProduct = prismaProduct ? ProductMapper.toDomain(prismaProduct) : null;
        }

        if (existingProduct) {
          existingProduct.update({
            stock: existingProduct.stock + parseFloat(prod.qCom),
            price: parseFloat(prod.vUnCom),
          });
          await tx.product.update({
            where: { id: existingProduct.id.toString() },
            data: ProductMapper.toPersistence(existingProduct),
          });
        } else {
          const newProduct = Product.create({
            name: prod.xProd,
            price: parseFloat(prod.vUnCom),
            stock: parseFloat(prod.qCom),
            organizationId,
          });
          await tx.product.create({
            data: ProductMapper.toPersistence(newProduct),
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
    const newProduct = Product.create({
      ...data,
      organizationId,
      price: data.price, // Ensure price is number
      stock: data.stock, // Ensure stock is number
    });
    const prismaProduct = await this.prisma.product.create({
      data: ProductMapper.toPersistence(newProduct),
    });
    return ProductMapper.toDomain(prismaProduct);
  }

  async findAll(organizationId: string): Promise<Product[]> {
    const prismaProducts = await this.prisma.product.findMany({ where: { organizationId } });
    console.log('Produtos do Prisma:', prismaProducts);
    return prismaProducts.map(ProductMapper.toDomain);
  }

  async findOne(organizationId: string, id: string): Promise<Product> {
    const prismaProduct = await this.prisma.product.findFirst({
      where: { id, organizationId },
    });
    if (!prismaProduct)
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    return ProductMapper.toDomain(prismaProduct);
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateProductDto,
  ): Promise<Product> {
    const existingProduct = await this.findOne(organizationId, id); // Returns DDD entity
    existingProduct.update(data); // Update DDD entity
    
    const updatedPrismaProduct = await this.prisma.product.update({
      where: { id: existingProduct.id.toString() }, // Use id from DDD entity
      data: ProductMapper.toPersistence(existingProduct), // Convert back to Prisma for persistence
    });
    return ProductMapper.toDomain(updatedPrismaProduct); // Convert back to DDD for return
  }

  async remove(organizationId: string, id: string): Promise<Product> {
    const product = await this.findOne(organizationId, id); // Garante que o produto existe e retorna DDD entity
    const deletedPrismaProduct = await this.prisma.product.delete({ where: { id: product.id.toString() } });
    return ProductMapper.toDomain(deletedPrismaProduct);
  }
}
