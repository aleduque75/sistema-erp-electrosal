
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
                isReactionProductGroup: oldProduct.produtoGrupo === 'Aurocianeto 68%',
              },
            });
          } else {
            // Se o grupo já existe, verifica se a flag está correta e atualiza se necessário
            const shouldBeReactionGroup = oldProduct.produtoGrupo === 'Aurocianeto 68%';
            if (productGroup.isReactionProductGroup !== shouldBeReactionGroup) {
              productGroup = await this.prisma.productGroup.update({
                where: { id: productGroup.id },
                data: { isReactionProductGroup: shouldBeReactionGroup },
              });
            }
          }
          productGroupId = productGroup.id;
        }

        const newProduct = await this.prisma.product.upsert({
          where: { externalId: oldProduct['unique id'] },
          update: {
            name: oldProduct.nome,
            stock: 0, // Always set stock to 0
            productGroupId: productGroupId,
          },
          create: {
            organizationId,
            name: oldProduct.nome,
            price: new Decimal(0), // Default price, adjust if needed
            stock: 0, // Always set stock to 0
            productGroupId: productGroupId,
            externalId: oldProduct['unique id'],
          },
        });

        // Special goldValue logic
        let specialGoldValue: number | undefined = undefined;
        if (oldProduct.nome.trim().toLowerCase() === 'el sal 68%') {
          specialGoldValue = 0.6802721088435374;
        }

        if (specialGoldValue !== undefined) {
          await this.prisma.product.update({
            where: { id: newProduct.id },
            data: { goldValue: specialGoldValue },
          });
        }

        results.push({ name: oldProduct.nome, status: 'success', newProductId: newProduct.id });
      } catch (error) {
        console.error(`Erro ao importar produto ${oldProduct.nome}:`, error.message);
        results.push({ name: oldProduct.nome, status: 'failed' });
      }
    }

    return results;
  }
}
