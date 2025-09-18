// apps/backend/src/settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UserSettings } from '@sistema-erp-electrosal/core'; // Added
import { UserSettingsMapper } from '../users/mappers/user-settings.mapper'; // Added

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // Busca as configurações do usuário, ou cria se não existirem
  async findOne(userId: string): Promise<UserSettings> {
    let prismaSettings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });
    if (!prismaSettings) {
      const newSettings = UserSettings.create({ userId });
      prismaSettings = await this.prisma.userSettings.create({
        data: UserSettingsMapper.toPersistence(newSettings),
      });
    }
    return UserSettingsMapper.toDomain(prismaSettings);
  }

  // Atualiza as configurações
  async update(userId: string, updateSettingDto: UpdateSettingDto): Promise<UserSettings> {
    console.log("SettingsService.update - updateSettingDto:", updateSettingDto); // ADDED

    const updatedPrismaSettings = await this.prisma.userSettings.update({
      where: { userId: userId }, // Update by userId directly
      data: {
        defaultReceitaContaId: updateSettingDto.defaultReceitaContaId,
        defaultCaixaContaId: updateSettingDto.defaultCaixaContaId,
        defaultDespesaContaId: updateSettingDto.defaultDespesaContaId,
        metalStockAccountId: updateSettingDto.metalStockAccountId,
        productionCostAccountId: updateSettingDto.productionCostAccountId,
      },
    });
    return UserSettingsMapper.toDomain(updatedPrismaSettings);
  }

  async getOrganizationSettings(organizationId: string) {
    return this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { absorbCreditCardFee: true },
    });
  }

  async updateOrganizationSettings(organizationId: string, absorbCreditCardFee: boolean) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { absorbCreditCardFee },
    });
  }
}
