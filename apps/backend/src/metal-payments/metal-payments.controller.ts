import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PayClientWithMetalDto } from './dto/pay-client-with-metal.dto';
import { PayClientWithMetalUseCase } from './use-cases/pay-client-with-metal.use-case';

@UseGuards(AuthGuard('jwt'))
@Controller('metal-payments')
export class MetalPaymentsController {
  constructor(
    private readonly payClientWithMetalUseCase: PayClientWithMetalUseCase,
  ) {}

  @Post('pay-client')
  async payClientWithMetal(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Body() payClientWithMetalDto: PayClientWithMetalDto,
  ) {
    return this.payClientWithMetalUseCase.execute(
      organizationId,
      userId,
      payClientWithMetalDto,
    );
  }
}
