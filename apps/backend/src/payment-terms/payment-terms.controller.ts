import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PaymentTermsService } from './payment-terms.service';
import { CreatePaymentTermDto } from './dto/create-payment-term.dto';
import { UpdatePaymentTermDto } from './dto/update-payment-term.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('payment-terms')
export class PaymentTermsController {
  constructor(private readonly paymentTermsService: PaymentTermsService) {}

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createPaymentTermDto: CreatePaymentTermDto
  ) {
    return this.paymentTermsService.create(organizationId, createPaymentTermDto);
  }

  @Get()
  findAll(@CurrentUser('orgId') organizationId: string) {
    return this.paymentTermsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string
  ) {
    return this.paymentTermsService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string, 
    @Body() updatePaymentTermDto: UpdatePaymentTermDto
  ) {
    return this.paymentTermsService.update(organizationId, id, updatePaymentTermDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string
  ) {
    return this.paymentTermsService.remove(organizationId, id);
  }
}