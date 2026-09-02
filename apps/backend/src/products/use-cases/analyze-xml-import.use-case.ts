import { Injectable, BadRequestException } from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { ImportXmlDto } from '../dtos/import-xml.dto';
import * as xml2js from 'xml2js';

@Injectable()
export class AnalyzeXmlImportUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(organizationId: string, importXmlDto: ImportXmlDto) {
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsedXml = await parser.parseStringPromise(importXmlDto.xmlContent);
    const nfeProc = parsedXml.nfeProc;
    if (!nfeProc) throw new BadRequestException('XML de NF-e inválido.');

    const nfe = nfeProc.NFe.infNFe;
    const nfeKey = nfe.$.Id.replace('NFe', '');
    const productsFromXml = Array.isArray(nfe.det) ? nfe.det : [nfe.det];

    const existingProducts = await this.productRepository.findAll(organizationId);
    const analyzedProducts = productsFromXml.map((item: any) => {
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
}
