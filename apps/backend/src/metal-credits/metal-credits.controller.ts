import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MetalCreditsService } from './metal-credits.service';

@UseGuards(AuthGuard('jwt'))
@Controller('metal-credits')
export class MetalCreditsController {
  constructor(private readonly metalCreditsService: MetalCreditsService) {}

  @Get('client/:clientId')
  async findByClientId(
    @CurrentUser('orgId') organizationId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.metalCreditsService.findByClientId(clientId, organizationId);
  }
}
