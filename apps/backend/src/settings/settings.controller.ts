import { Controller, Get, Body, Put, UseGuards, Request, Post, Param, Delete } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateAppearanceSettingsDto } from '../organization/dto/update-appearance-settings.dto';
import { CreateThemePresetDto } from './dto/create-theme-preset.dto';
import { UpdateThemePresetDto } from './dto/update-theme-preset.dto';

import { Public } from '../auth/decorators/public.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findOne(@Request() req) {
    return this.settingsService.findOne(req.user.id);
  }

  // Atualiza preferência do usuário (Light/Dark/System)
  @UseGuards(AuthGuard('jwt'))
  @Put()
  update(@Request() req, @Body() updateSettingDto: UpdateSettingDto) {
    return this.settingsService.update(req.user.id, updateSettingDto);
  }

  // Busca cores da organização - AGORA PÚBLICO
  @Public()
  @Get('appearance')
  getAppearanceSettings(@CurrentUser('orgId') organizationId?: string) {
    // Se não houver organizationId (usuário não autenticado), busca a primeira organização
    return this.settingsService.getAppearanceSettings(organizationId);
  }

  // Salva o JSON estruturado { light: {}, dark: {} }
  @UseGuards(AuthGuard('jwt'))
  @Put('appearance')
  updateAppearanceSettings(
    @CurrentUser('orgId') organizationId: string,
    @Body() dto: UpdateAppearanceSettingsDto,
  ) {
    return this.settingsService.updateAppearanceSettings(organizationId, dto);
  }

  @Get('organization')
  getOrganizationSettings(@CurrentUser('orgId') organizationId: string) {
    return this.settingsService.getOrganizationSettings(organizationId);
  }

  // --- Theme Presets ---
  @UseGuards(AuthGuard('jwt'))
  @Post('themes')
  createThemePreset(
    @CurrentUser('orgId') organizationId: string,
    @Body() createThemePresetDto: CreateThemePresetDto,
  ) {
    return this.settingsService.createThemePreset(organizationId, createThemePresetDto);
  }

  @Get('themes')
  findAllThemePresets(@CurrentUser('orgId') organizationId: string) {
    return this.settingsService.findAllThemePresets(organizationId);
  }

  @Get('themes/:id')
  findOneThemePreset(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.settingsService.findOneThemePreset(organizationId, id);
  }

  @Put('themes/:id')
  updateThemePreset(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateThemePresetDto: UpdateThemePresetDto,
  ) {
    return this.settingsService.updateThemePreset(organizationId, id, updateThemePresetDto);
  }

  @Delete('themes/:id')
  removeThemePreset(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.settingsService.removeThemePreset(organizationId, id);
  }
}
