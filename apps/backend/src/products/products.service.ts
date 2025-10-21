import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dtos/create-product.dto';
import { ConfirmImportXmlDto, ImportXmlDto } from './dtos/import-xml.dto';
import { Product, ProductGroup } from '@sistema-erp-electrosal/core'; // Changed
import { ProductMapper } from './mappers/product.mapper'; // Added
import { ProductGroupMapper } from './mappers/product-group.mapper'; // Added
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
            data: { ...ProductMapper.toPersistence(existingProduct) },
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
      price: data.price,
      stock: data.stock,
      costPrice: data.costPrice,
      goldValue: data.goldValue,
    });
    const prismaProduct = await this.prisma.product.create({
      data: {
        ...ProductMapper.toPersistence(newProduct),
        productGroup: data.productGroupId ? { connect: { id: data.productGroupId } } : undefined,
      },
    });
    return ProductMapper.toDomain(prismaProduct);
  }

  async findAll(organizationId: string): Promise<any[]> {
    const prismaProducts = await this.prisma.product.findMany({
      where: { organizationId },
      include: {
        productGroup: true,
        inventoryLots: {
          where: { remainingQuantity: { gt: 0 } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return prismaProducts;
  }

  async findOne(organizationId: string, id: string): Promise<Product> {
    const prismaProduct = await this.prisma.product.findFirst({
      where: { id, organizationId },
      include: { productGroup: true }, // Incluir o grupo do produto
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

    let productGroup: ProductGroup | undefined = undefined;
    if (data.productGroupId) {
      const prismaProductGroup = await this.prisma.productGroup.findUnique({
        where: { id: data.productGroupId },
      });
      if (prismaProductGroup) {
        productGroup = ProductGroupMapper.toDomain(prismaProductGroup);
      }
    }

    existingProduct.update({
      name: data.name,
      description: data.description,
      price: data.price,
      costPrice: data.costPrice,
      stock: data.stock,
      stockUnit: data.stockUnit,
      goldValue: data.goldValue,
      productGroup: productGroup,
    }); // Update DDD entity
    
    const updatedPrismaProduct = await this.prisma.product.update({
      where: { id: existingProduct.id.toString() }, // Use id from DDD entity
      data: ProductMapper.toPersistence(existingProduct),
    });
    return ProductMapper.toDomain(updatedPrismaProduct); // Convert back to DDD for return
  }

  async remove(organizationId: string, id: string): Promise<Product> {
    const product = await this.findOne(organizationId, id); // Garante que o produto existe e retorna DDD entity
    const deletedPrismaProduct = await this.prisma.product.delete({ where: { id: product.id.toString() } });
    return ProductMapper.toDomain(deletedPrismaProduct);
  }

  async getAllProductGroups(organizationId: string): Promise<any[]> {
    return this.prisma.productGroup.findMany({ where: { organizationId } });
  }

  async fixReactionGroupFlag(organizationId: string): Promise<{ message: string }> {
    const groupName = 'Aurocianeto 68%';
    const productGroup = await this.prisma.productGroup.findFirst({
      where: { name: groupName, organizationId },
    });

    if (!productGroup) {
      throw new NotFoundException(`Grupo de produto "${groupName}" não encontrado.`);
    }

    if (productGroup.isReactionProductGroup) {
      return { message: `O grupo "${groupName}" já está configurado corretamente.` };
    }

    await this.prisma.productGroup.update({
      where: { id: productGroup.id },
      data: { isReactionProductGroup: true },
    });

    return { message: `Grupo "${groupName}" corrigido com sucesso.` };
  }
}
