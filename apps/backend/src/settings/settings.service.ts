import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateAppearanceSettingsDto } from '../organization/dto/update-appearance-settings.dto';
import { UserSettings } from '@sistema-erp-electrosal/core';
import { UserSettingsMapper } from '../users/mappers/user-settings.mapper';
import { CreateThemePresetDto } from './dto/create-theme-preset.dto';
import { UpdateThemePresetDto } from './dto/update-theme-preset.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) { }

  /**
   * Busca as configurações do usuário. Se não existirem, cria o registro inicial.
   * Este é o método que o confirm-sale.use-case.ts está procurando.
   */
  async findOne(userId: string): Promise<UserSettings> {
    let prismaSettings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!prismaSettings) {
      // Cria uma nova instância de domínio e persiste no banco
      const newSettings = UserSettings.create({ userId });
      prismaSettings = await this.prisma.userSettings.create({
        data: UserSettingsMapper.toPersistence(newSettings),
      });
    }

    return UserSettingsMapper.toDomain(prismaSettings);
  }

  /**
   * Atualiza as configurações de preferência do usuário (incluindo o novo Tema)
   */
  async update(
    userId: string,
    updateSettingDto: UpdateSettingDto,
  ): Promise<UserSettings> {
    console.log(`[DEBUG] Updating settings for user ${userId}:`, updateSettingDto);
    const updatedPrismaSettings = await this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        theme: updateSettingDto.theme,
        defaultReceitaContaId: updateSettingDto.defaultReceitaContaId,
        defaultCaixaContaId: updateSettingDto.defaultCaixaContaId,
        defaultDespesaContaId: updateSettingDto.defaultDespesaContaId,
        metalStockAccountId: updateSettingDto.metalStockAccountId,
        productionCostAccountId: updateSettingDto.productionCostAccountId,
        metalCreditPayableAccountId:
          updateSettingDto.metalCreditPayableAccountId,
      },
      create: {
        userId,
        theme: updateSettingDto.theme || 'light', // Default to light if not provided
      },
    });

    console.log('[DEBUG] Updated settings result:', updatedPrismaSettings);
    return UserSettingsMapper.toDomain(updatedPrismaSettings);
  }

  // --- CONFIGURAÇÕES DE APARÊNCIA DA ORGANIZAÇÃO (JSON) ---

  async getAppearanceSettings(organizationId?: string) {
    let targetOrganizationId = organizationId;

    if (!targetOrganizationId) {
      const defaultLandingPage = await this.prisma.landingPage.findUnique({
        where: { name: 'default' },
      });
      if (defaultLandingPage && defaultLandingPage.organizationId) {
        targetOrganizationId = defaultLandingPage.organizationId;
      } else {
        return null; // No default landing page or it's not linked to an organization
      }
    }

    return this.prisma.appearanceSettings.findUnique({
      where: { organizationId: targetOrganizationId },
      include: {
        logoImage: true, // Inclui a imagem do logo na resposta
      },
    });
  }

  async updateAppearanceSettings(
    organizationId: string,
    dto: UpdateAppearanceSettingsDto,
  ) {
    return this.prisma.appearanceSettings.upsert({
      where: { organizationId },
      update: {
        customTheme: dto.customTheme, // Salvando no campo JSON unificado
      },
      create: {
        organizationId,
        customTheme: dto.customTheme,
      },
    });
  }

  // --- CONFIGURAÇÕES GERAIS DA ORGANIZAÇÃO ---

  async getOrganizationSettings(organizationId: string) {
    return this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { absorbCreditCardFee: true, creditCardReceiveDays: true },
    });
  }

  async updateOrganizationSettings(
    organizationId: string,
    absorbCreditCardFee: boolean,
  ) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { absorbCreditCardFee },
    });
  }

  // --- Theme Presets ---
  async createThemePreset(
    organizationId: string,
    dto: CreateThemePresetDto,
  ) {
    return this.prisma.themePreset.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  async findAllThemePresets(organizationId: string) {
    return this.prisma.themePreset.findMany({
      where: { organizationId },
    });
  }

  async findOneThemePreset(organizationId: string, id: string) {
    const preset = await this.prisma.themePreset.findUnique({
      where: { id, organizationId },
    });
    if (!preset) {
      throw new NotFoundException(`ThemePreset with ID ${id} not found.`);
    }
    return preset;
  }

  async updateThemePreset(
    organizationId: string,
    id: string,
    dto: UpdateThemePresetDto,
  ) {
    const preset = await this.prisma.themePreset.findUnique({
      where: { id, organizationId },
    });
    if (!preset) {
      throw new NotFoundException(`ThemePreset with ID ${id} not found.`);
    }
    return this.prisma.themePreset.update({
      where: { id, organizationId },
      data: dto,
    });
  }

  async removeThemePreset(organizationId: string, id: string) {
    const preset = await this.prisma.themePreset.findUnique({
      where: { id, organizationId },
    });
    if (!preset) {
      throw new NotFoundException(`ThemePreset with ID ${id} not found.`);
    }
    return this.prisma.themePreset.delete({
      where: { id, organizationId },
    });
  }
}
