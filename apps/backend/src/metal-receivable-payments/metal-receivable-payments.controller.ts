import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@auth/decorators/current-user.decorator';
import { CreateMetalReceivablePaymentDto } from './dtos/create-payment.dto';
import { CreateMetalReceivablePaymentUseCase } from './use-cases/create-payment.use-case';

@UseGuards(AuthGuard('jwt'))
@Controller('metal-receivable-payments')
export class MetalReceivablePaymentsController {
  constructor(private readonly createPaymentUseCase: CreateMetalReceivablePaymentUseCase) {}

  @Post()
  async createPayment(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: CreateMetalReceivablePaymentDto,
  ) {
    return this.createPaymentUseCase.execute(organizationId, dto);
  }
}
