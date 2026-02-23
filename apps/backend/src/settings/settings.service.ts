import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateAppearanceSettingsDto } from '../organization/dto/update-appearance-settings.dto';
import { UserSettings } from '@sistema-erp-electrosal/core';
import { UserSettingsMapper } from '../users/mappers/user-settings.mapper';
import { CreateThemePresetDto } from './dto/create-theme-preset.dto';
import { UpdateThemePresetDto } from './dto/update-theme-preset.dto';
import { Prisma } from '@prisma/client'; // ✅ Necessário para InputJsonValue

import { MediaService } from '../media/media.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService,
  ) { }

  /**
   * Busca as configurações do usuário. Se não existirem, cria o registro inicial.
   */
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

  /**
   * Atualiza as configurações de preferência do usuário (Light/Dark no ERP)
   */
  async update(
    userId: string,
    updateSettingDto: UpdateSettingDto,
  ): Promise<UserSettings> {
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
        theme: updateSettingDto.theme || 'light',
      },
    });

    return UserSettingsMapper.toDomain(updatedPrismaSettings);
  }

  // --- CONFIGURAÇÕES DE APARÊNCIA DA ORGANIZAÇÃO (TEMA CUSTOMIZADO) ---

  async getAppearanceSettings(organizationId?: string) {
    let targetOrganizationId = organizationId;

    if (!targetOrganizationId) {
      const defaultLandingPage = await this.prisma.landingPage.findUnique({
        where: { name: 'default' },
      });
      if (defaultLandingPage && defaultLandingPage.organizationId) {
        targetOrganizationId = defaultLandingPage.organizationId;
      }
    }

    if (!targetOrganizationId) return null;

    console.log(`[SettingsService] Fetching appearance for Org: ${targetOrganizationId}`);

    const result = await this.prisma.appearanceSettings.findUnique({
      where: { organizationId: targetOrganizationId },
      include: {
        logo: true,
      },
    });

    console.log(`[SettingsService] Found settings: ${!!result}`, { themeName: result?.themeName });
    return result;
  }

  async updateAppearanceSettings(
    organizationId: string,
    dto: UpdateAppearanceSettingsDto,
  ) {
    // 🛡️ Log para debug: veja se os campos aparecem no seu terminal
    console.log(
      `[SettingsService] Persistindo dados para Org: ${organizationId}`,
      {
        themeName: dto.themeName,
        hasSidebar: !!dto.sidebarTheme,
        hasCustom: !!dto.customTheme,
      },
    );

    // ✅ Forçamos a tipagem JSON para que o Prisma não ignore os objetos
    const updateData = {
      themeName: dto.themeName,
      sidebarTheme: (dto.sidebarTheme || {}) as Prisma.InputJsonValue,
      customTheme: (dto.customTheme || {}) as Prisma.InputJsonValue,
      logoId: dto.logoId,
    };

    // --- Lógica para deletar logo antigo se substituído ---
    if (dto.logoId) {
      const currentSettings = await this.prisma.appearanceSettings.findUnique({
        where: { organizationId },
        select: { logoId: true },
      });

      if (currentSettings?.logoId && currentSettings.logoId !== dto.logoId) {
        console.log(`[SettingsService] Logo substituído de ${currentSettings.logoId} para ${dto.logoId}. Excluindo antigo...`);
        try {
          await this.mediaService.remove(currentSettings.logoId).catch(err => {
            console.error(`[SettingsService] Erro ao deletar logo antigo ${currentSettings.logoId}:`, err);
          });
        } catch (e) {
          // Silencioso para não quebrar o salvamento
        }
      }
    }

    return this.prisma.appearanceSettings.upsert({
      where: { organizationId },
      update: updateData,
      create: {
        organizationId,
        ...updateData,
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

  // --- THEME PRESETS ---

  async createThemePreset(organizationId: string, dto: CreateThemePresetDto) {
    return this.prisma.themePreset.create({
      data: {
        name: dto.name,
        presetData: dto.presetData as Prisma.InputJsonValue,
        isDefault: dto.isDefault,
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
    if (!preset) throw new NotFoundException(`Preset ${id} não encontrado.`);
    return preset;
  }

  async updateThemePreset(
    organizationId: string,
    id: string,
    dto: UpdateThemePresetDto,
  ) {
    return this.prisma.themePreset.update({
      where: { id, organizationId },
      data: {
        name: dto.name,
        presetData: dto.presetData as Prisma.InputJsonValue,
        isDefault: dto.isDefault,
      },
    });
  }

  async removeThemePreset(organizationId: string, id: string) {
    return this.prisma.themePreset.delete({
      where: { id, organizationId },
    });
  }
}
