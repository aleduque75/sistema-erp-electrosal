import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CreateRawMaterialDto } from './raw-materials/dtos/create-raw-material.dto';
import { UpdateRawMaterialDto } from './raw-materials/dtos/update-raw-material.dto';
import { RawMaterial } from '@prisma/client';

@Injectable()
export class RawMaterialsService {
  constructor(private prisma: PrismaService) {}

  async create(
    organizationId: string,
    dto: CreateRawMaterialDto,
  ): Promise<RawMaterial> {
    return this.prisma.rawMaterial.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string): Promise<RawMaterial[]> {
    return this.prisma.rawMaterial.findMany({
      where: { organizationId },
    });
  }

  async findOne(organizationId: string, id: string): Promise<RawMaterial> {
    const rawMaterial = await this.prisma.rawMaterial.findFirst({
      where: { id, organizationId },
    });

    if (!rawMaterial) {
      throw new NotFoundException(`Matéria-prima com ID ${id} não encontrada.`);
    }

    return rawMaterial;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateRawMaterialDto,
  ): Promise<RawMaterial> {
    await this.findOne(organizationId, id);
    return this.prisma.rawMaterial.update({
      where: { id },
      data: dto,
    });
  }

  async remove(organizationId: string, id: string): Promise<RawMaterial> {
    await this.findOne(organizationId, id);
    return this.prisma.rawMaterial.delete({
      where: { id },
    });
  }
}
