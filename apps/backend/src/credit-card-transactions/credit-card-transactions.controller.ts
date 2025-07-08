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
} from '@nestjs/common';
import { CreditCardTransactionsService } from './credit-card-transactions.service';
import {
  CreateCreditCardTransactionDto,
  UpdateCreditCardTransactionDto,
} from './dtos/credit-card-transaction.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('credit-card-transactions')
export class CreditCardTransactionsController {
  constructor(private readonly service: CreditCardTransactionsService) {}

  @Post()
  create(@Request() req, @Body() createDto: CreateCreditCardTransactionDto) {
    return this.service.create(req.user.id, createDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateCreditCardTransactionDto,
  ) {
    return this.service.update(req.user.id, id, updateDto);
  }
}
