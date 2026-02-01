import { Controller, Get, Body, Patch, UseGuards, Put } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateAppearanceSettingsDto } from './dto/update-appearance-settings.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  findOne(@CurrentUser('orgId') orgId: string) {
    return this.organizationService.findOne(orgId);
  }

  @Patch()
  update(
    @CurrentUser('orgId') orgId: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(orgId, updateOrganizationDto);
  }

  @Put('/appearance')
  updateAppearance(
    @CurrentUser('orgId') orgId: string,
    @Body() updateAppearanceDto: UpdateAppearanceSettingsDto,
  ) {
    return this.organizationService.updateAppearanceSettings(orgId, updateAppearanceDto);
  }
}