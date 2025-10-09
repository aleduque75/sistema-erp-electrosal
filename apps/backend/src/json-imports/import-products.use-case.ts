
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import Decimal from 'decimal.js';

interface OldProductData {
  nome: string;
  produtoGrupo?: string;
  quantidade?: string;
  unidade?: string;
  'unique id': string;
}

@Injectable()
export class ImportProductsUseCase {
  constructor(private prisma: PrismaService) {}

  private parseNumber(value: string | undefined): number {
    if (!value) return 0;
    return parseFloat(value.replace(',', '.'));
  }

  async execute(organizationId: string, jsonDirectory: string): Promise<any> {
    const productsFilePath = path.join(jsonDirectory, 'produtos.json');

    if (!fs.existsSync(productsFilePath)) {
      throw new BadRequestException('Arquivo produtos.json não encontrado no diretório especificado.');
    }

    const oldProducts: OldProductData[] = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));

    const results: { name: string; status: string; newProductId?: string }[] = [];

    for (const oldProduct of oldProducts) {
      try {
        let productGroupId: string | undefined;
        if (oldProduct.produtoGrupo) {
          let productGroup = await this.prisma.productGroup.findFirst({
            where: { organizationId, name: oldProduct.produtoGrupo },
          });

          if (!productGroup) {
            productGroup = await this.prisma.productGroup.create({
              data: {
                organizationId,
                name: oldProduct.produtoGrupo,
                description: `Grupo importado de ${oldProduct.produtoGrupo}`,
                isReactionProductGroup: oldProduct.produtoGrupo === 'Aurocianeto de Potassio',
              },
            });
          }
          productGroupId = productGroup.id;
        }

        const newProduct = await this.prisma.product.upsert({
          where: { externalId: oldProduct['unique id'] },
          update: {
            name: oldProduct.nome,
            stock: this.parseNumber(oldProduct.quantidade),
            productGroupId: productGroupId,
          },
          create: {
            organizationId,
            name: oldProduct.nome,
            price: new Decimal(0), // Default price, adjust if needed
            stock: this.parseNumber(oldProduct.quantidade),
            productGroupId: productGroupId,
            externalId: oldProduct['unique id'],
          },
        });

        results.push({ name: oldProduct.nome, status: 'success', newProductId: newProduct.id });
      } catch (error) {
        console.error(`Erro ao importar produto ${oldProduct.nome}:`, error.message);
        results.push({ name: oldProduct.nome, status: 'failed' });
      }
    }

    return results;
  }
}
