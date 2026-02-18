import {
  Controller,
  Get,
  Body,
  Put,
  UseGuards,
  Request,
  Post,
  Param,
  Delete,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { AuthGuard } from '@nestjs/passport';
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

  @UseGuards(AuthGuard('jwt'))
  @Put()
  update(@Request() req, @Body() updateSettingDto: UpdateSettingDto) {
    return this.settingsService.update(req.user.id, updateSettingDto);
  }

  // Busca cores - Público para a Landing Page
  @Public()
  @Get('appearance')
  async getAppearanceSettings(@Request() req) {
    // Tenta pegar do usuário logado, se não tiver, o service busca o padrão
    const organizationId = req.user?.organizationId || req.user?.orgId;
    return this.settingsService.getAppearanceSettings(organizationId);
  }

  // 🚀 ONDE ESTAVA O PROBLEMA: Salvamento de Aparência
  @UseGuards(AuthGuard('jwt'))
  @Put('appearance')
  updateAppearanceSettings(
    @Request() req,
    @Body() dto: UpdateAppearanceSettingsDto,
  ) {
    // ✅ Pega o ID da organização garantindo os dois nomes comuns (orgId ou organizationId)
    const organizationId = req.user.organizationId || req.user.orgId;

    if (!organizationId) {
      console.error('❌ Erro: organizationId não encontrado no token JWT');
    }

    return this.settingsService.updateAppearanceSettings(organizationId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('organization')
  getOrganizationSettings(@Request() req) {
    const organizationId = req.user.organizationId || req.user.orgId;
    return this.settingsService.getOrganizationSettings(organizationId);
  }

  // --- Theme Presets ---
  @UseGuards(AuthGuard('jwt'))
  @Post('themes')
  createThemePreset(@Request() req, @Body() dto: CreateThemePresetDto) {
    const orgId = req.user.organizationId || req.user.orgId;
    return this.settingsService.createThemePreset(orgId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('themes')
  findAllThemePresets(@Request() req) {
    const orgId = req.user.organizationId || req.user.orgId;
    return this.settingsService.findAllThemePresets(orgId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('themes/:id')
  findOneThemePreset(@Request() req, @Param('id') id: string) {
    const orgId = req.user.organizationId || req.user.orgId;
    return this.settingsService.findOneThemePreset(orgId, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('themes/:id')
  updateThemePreset(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateThemePresetDto,
  ) {
    const orgId = req.user.organizationId || req.user.orgId;
    return this.settingsService.updateThemePreset(orgId, id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('themes/:id')
  removeThemePreset(@Request() req, @Param('id') id: string) {
    const orgId = req.user.organizationId || req.user.orgId;
    return this.settingsService.removeThemePreset(orgId, id);
  }
}
