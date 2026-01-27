import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        sidebarLogoImage: true,
      },
    });
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found.`);
    }
    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    // Ensure the organization exists
    await this.findOne(id);

    return this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
    });
  }
}