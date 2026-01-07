import { Controller, Get, Param, UseGuards, Post, Body, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MetalCreditsService } from './metal-credits.service';
import { MetalCreditWithUsageDto } from './dtos/metal-credit-with-usage.dto';
import { PayMetalCreditWithCashUseCase } from './use-cases/pay-metal-credit-with-cash.use-case';
import { PayWithClientCreditUseCase } from './use-cases/pay-with-client-credit.use-case';
import { PayMetalCreditWithCashDto } from './dtos/pay-metal-credit-with-cash.dto';
import { PayWithClientCreditDto } from './dtos/pay-with-client-credit.dto';
import { UpdateMetalCreditDto } from './dtos/update-metal-credit.dto';
import { User } from '@prisma/client';

@UseGuards(AuthGuard('jwt'))
@Controller('metal-credits')
export class MetalCreditsController {
  constructor(
    private readonly metalCreditsService: MetalCreditsService,
    private readonly payMetalCreditWithCashUseCase: PayMetalCreditWithCashUseCase,
    private readonly payWithClientCreditUseCase: PayWithClientCreditUseCase,
  ) {}

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateMetalCreditDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.metalCreditsService.update(id, data, organizationId);
  }

  @Post('pay-with-cash')
  async payWithCash(
    @CurrentUser() user: User,
    @Body() dto: PayMetalCreditWithCashDto,
  ) {
    return this.payMetalCreditWithCashUseCase.execute(user.organizationId, user.id, dto);
  }

  @Post('pay-with-client-credit')
  async payWithClientCredit(
    @CurrentUser() user: User,
    @Body() dto: PayWithClientCreditDto,
  ) {
    return this.payWithClientCreditUseCase.execute(user.organizationId, user.id, dto);
  }

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
