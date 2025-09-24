import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductGroupDto, UpdateProductGroupDto } from './dtos/product-group.dto';
import { ProductGroup } from '@prisma/client';

@Injectable()
export class ProductGroupsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, data: CreateProductGroupDto): Promise<ProductGroup> {
    return this.prisma.productGroup.create({
      data: {
        ...data,
        organization: { connect: { id: organizationId } },
      },
    });
  }

  async findAll(organizationId: string): Promise<ProductGroup[]> {
    return this.prisma.productGroup.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<ProductGroup> {
    const productGroup = await this.prisma.productGroup.findFirst({
      where: { id, organizationId },
    });
    if (!productGroup) {
      throw new NotFoundException(`ProductGroup com ID ${id} não encontrado.`);
    }
    return productGroup;
  }

  async update(organizationId: string, id: string, data: UpdateProductGroupDto): Promise<ProductGroup> {
    await this.findOne(organizationId, id); // Verifica se existe e pertence à organização
    return this.prisma.productGroup.update({
      where: { id },
      data,
    });
  }

  async remove(organizationId: string, id: string): Promise<ProductGroup> {
    await this.findOne(organizationId, id); // Verifica se existe e pertence à organização
    return this.prisma.productGroup.delete({
      where: { id },
    });
  }
}
