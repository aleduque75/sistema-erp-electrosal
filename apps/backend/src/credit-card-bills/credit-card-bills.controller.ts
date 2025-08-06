import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CreditCardBillsService } from './credit-card-bills.service';
import { CreateCreditCardBillDto, PayCreditCardBillDto } from './dtos/credit-card-bill.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('credit-card-bills')
export class CreditCardBillsController {
  constructor(private readonly service: CreditCardBillsService) {}

  @Post('from-transactions')
  createFromTransactions(@CurrentUser('orgId') organizationId: string, @Body() createDto: CreateCreditCardBillDto) {
    return this.service.createFromTransactions(organizationId, createDto);
  }

  @Get()
  findAll(@CurrentUser('orgId') organizationId: string) {
    return this.service.findAll(organizationId);
  }

  @Get(':id')
  findOne(@CurrentUser('orgId') organizationId: string, @Param('id') id: string) {
    return this.service.findOne(organizationId, id);
  }

  @Post(':id/pay')
  pay(@CurrentUser('orgId') organizationId: string, @Param('id') id: string, @Body() payDto: PayCreditCardBillDto) {
    return this.service.pay(organizationId, id, payDto);
  }
  
  // ... métodos update e remove
}