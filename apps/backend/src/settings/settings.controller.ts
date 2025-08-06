// apps/backend/src/settings/settings.controller.ts
import { Controller, Get, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateOrganizationSettingDto } from './dto/update-organization-setting.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findOne(@Request() req) {
    return this.settingsService.findOne(req.user.id);
  }

  @Patch()
  update(@Request() req, @Body() updateSettingDto: UpdateSettingDto) {
    return this.settingsService.update(req.user.id, updateSettingDto);
  }

  @Get('organization')
  getOrganizationSettings(@CurrentUser('orgId') organizationId: string) {
    return this.settingsService.getOrganizationSettings(organizationId);
  }

  @Patch('organization')
  updateOrganizationSettings(
    @CurrentUser('orgId') organizationId: string,
    @Body() updateDto: UpdateOrganizationSettingDto,
  ) {
    return this.settingsService.updateOrganizationSettings(
      organizationId,
      updateDto.absorbCreditCardFee,
    );
  }
}
