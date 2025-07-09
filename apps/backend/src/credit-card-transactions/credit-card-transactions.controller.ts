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
  Query,
} from '@nestjs/common';
import { CreditCardTransactionsService } from './credit-card-transactions.service';
import { AuthGuard } from '@nestjs/passport';
// ✅ CORREÇÃO: Importando todas as classes DTO necessárias
import {
  CreateCreditCardTransactionDto,
  UpdateCreditCardTransactionDto,
  CreateInstallmentTransactionsDto,
} from './dtos/credit-card-transaction.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('credit-card-transactions')
export class CreditCardTransactionsController {
  constructor(private readonly service: CreditCardTransactionsService) {}

  @Post()
  create(@Request() req, @Body() createDto: CreateCreditCardTransactionDto) {
    return this.service.create(req.user.id, createDto);
  }

  @Post('installments')
  createInstallments(
    @Request() req,
    @Body() createDto: CreateInstallmentTransactionsDto,
  ) {
    return this.service.createInstallmentTransactions(req.user.id, createDto);
  }
  @Get()
  findAll(
    @Request() req,
    @Query('creditCardId') creditCardId?: string,
    @Query('status') status?: 'billed' | 'unbilled' | 'all',
    @Query('startDate') startDate?: string, // Recebe como string
    @Query('endDate') endDate?: string, // Recebe como string
  ) {
    // Converte para Date antes de passar para o serviço
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    return this.service.findAll(
      req.user.id,
      creditCardId,
      status,
      parsedStartDate,
      parsedEndDate,
    );
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

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
