import { Controller, Get, Body, Patch, UseGuards, Put } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateAppearanceSettingsDto } from './dto/update-appearance-settings.dto';
// Importação exata baseada no seu grep
import { Public } from '../auth/decorators/public.decorator'; 

@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Public() // <--- O JwtAuthGuard agora vai ignorar esta rota
  @Get()
  async findOne() {
    // Usando o ID que confirmamos no banco
    const orgId = '2a5bb448-056b-4b87-b02f-fec691dd658d';
    return this.organizationService.findOne(orgId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch()
  update(
    @CurrentUser('orgId') orgId: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(orgId, updateOrganizationDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('/appearance')
  updateAppearance(
    @CurrentUser('orgId') orgId: string,
    @Body() updateAppearanceDto: UpdateAppearanceSettingsDto,
  ) {
    return this.organizationService.updateAppearanceSettings(orgId, updateAppearanceDto);
  }
}
