import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { XmlImportLogsService } from '../../xml-import-logs/xml-import-logs.service';
import { ConfirmImportXmlDto } from '../dtos/import-xml.dto';
import { ProductEntity } from '../entities/product.entity';
import { ProductMapper } from '../mappers/product.mapper';
import * as xml2js from 'xml2js';

@Injectable()
export class ConfirmXmlImportUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xmlImportLogsService: XmlImportLogsService,
  ) {}

  async execute(
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

    const existingLog = await this.xmlImportLogsService.findByNfeKey(
      organizationId,
      nfeKey,
    );
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
        let existingProductRaw: any = null;

        if (manualMatchId) {
          existingProductRaw = await tx.product.findUnique({
            where: { id: manualMatchId, organizationId },
          });
        } else {
          existingProductRaw = await tx.product.findFirst({
            where: { name: prod.xProd, organizationId },
          });
        }

        if (existingProductRaw) {
          const productEntity = ProductMapper.toDomain(existingProductRaw);
          productEntity.adjustStock(parseFloat(prod.qCom));
          productEntity.updatePrice(parseFloat(prod.vUnCom));

          await tx.product.update({
            where: { id: productEntity.id },
            data: {
              stock: productEntity.stock,
              price: productEntity.price,
            },
          });
        } else {
          const newProduct = ProductEntity.create({
            organizationId,
            name: prod.xProd,
            price: parseFloat(prod.vUnCom),
            stock: parseFloat(prod.qCom),
          });

          await tx.product.create({
            data: {
              organizationId: newProduct.organizationId,
              name: newProduct.name,
              price: newProduct.price,
              stock: newProduct.stock,
              stockUnit: newProduct.stockUnit,
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
}
