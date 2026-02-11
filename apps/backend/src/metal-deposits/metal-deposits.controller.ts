import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateMetalDepositDto } from './dtos/create-metal-deposit.dto';
import { CreateMetalDepositUseCase } from './use-cases/create-metal-deposit.use-case';

@UseGuards(AuthGuard('jwt'))
@Controller('metal-deposits')
export class MetalDepositsController {
  constructor(private readonly createDepositUseCase: CreateMetalDepositUseCase) {}

  @Post()
  async createDeposit(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: CreateMetalDepositDto,
  ) {
    return this.createDepositUseCase.execute(organizationId, dto);
  }
}
