import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MetalPaymentsService } from './metal-payments.service';
import { PayClientWithMetalDto } from './dto/pay-client-with-metal.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('metal-payments')
export class MetalPaymentsController {
  constructor(private readonly metalPaymentsService: MetalPaymentsService) {}

  @Post('pay-client')
  async payClientWithMetal(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Body() payClientWithMetalDto: PayClientWithMetalDto,
  ) {
    return this.metalPaymentsService.payClientWithMetal(organizationId, userId, payClientWithMetalDto);
  }
}
