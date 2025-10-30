import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MetalCreditsService } from './metal-credits.service';
import { MetalCreditWithUsageDto } from './dtos/metal-credit-with-usage.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('metal-credits')
export class MetalCreditsController {
  constructor(private readonly metalCreditsService: MetalCreditsService) {}

  @Get()
  async findAll(@CurrentUser('orgId') organizationId: string): Promise<MetalCreditWithUsageDto[]> {
    return this.metalCreditsService.findAll(organizationId);
  }

  @Get('client/:clientId')
  async findByClientId(
    @CurrentUser('orgId') organizationId: string,
    @Param('clientId') clientId: string,
  ): Promise<MetalCreditWithUsageDto[]> {
    return this.metalCreditsService.findByClientId(clientId, organizationId);
  }
}
