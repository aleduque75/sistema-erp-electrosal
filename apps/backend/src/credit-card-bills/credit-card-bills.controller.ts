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
  CreateCreditCardBillWithTransactionsDto,
} from './dtos/credit-card-bill.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('credit-card-bills')
export class CreditCardBillsController {
  constructor(private readonly service: CreditCardBillsService) {}

  @Post()
  create(@Request() req, @Body() createDto: CreateCreditCardBillDto) {
    return this.service.create(req.user.id, createDto);
  }

  @Post('with-transactions')
  createBillWithTransactions(
    @Request() req,
    @Body() createDto: CreateCreditCardBillWithTransactionsDto,
  ) {
    return this.service.createBillWithTransactions(req.user.id, createDto);
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
