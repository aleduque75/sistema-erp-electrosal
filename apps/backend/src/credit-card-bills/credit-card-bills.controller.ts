import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreditCardBillsService } from './credit-card-bills.service';
import {
  CreateCreditCardBillDto,
  UpdateCreditCardBillDto,
  PayCreditCardBillDto,
  CreateBillFromTransactionsDto,
} from './dtos/credit-card-bill.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('credit-card-bills')
export class CreditCardBillsController {
  constructor(private readonly service: CreditCardBillsService) {}

  // ✅ ROTA QUE ESTAVA FALTANDO
  @Post('from-transactions')
  createFromTransactions(
    @Request() req,
    @Body() createDto: CreateBillFromTransactionsDto,
  ) {
    return this.service.createFromTransactions(req.user.id, createDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.id, id);
  }

  @Patch(':id/pay')
  pay(
    @Request() req,
    @Param('id') id: string,
    @Body() payDto: PayCreditCardBillDto,
  ) {
    return this.service.pay(req.user.id, id, payDto);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateCreditCardBillDto,
  ) {
    return this.service.update(req.user.id, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
