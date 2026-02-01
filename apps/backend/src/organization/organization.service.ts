import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateAppearanceSettingsDto } from './dto/update-appearance-settings.dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        appearanceSettings: true,
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

  async updateAppearanceSettings(
    orgId: string,
    updateAppearanceDto: UpdateAppearanceSettingsDto,
  ) {
    return this.prisma.appearanceSettings.upsert({
      where: { organizationId: orgId },
      update: {
        customTheme: updateAppearanceDto.customTheme,
      },
      create: {
        organizationId: orgId,
        customTheme: updateAppearanceDto.customTheme,
      },
    });
  }
}