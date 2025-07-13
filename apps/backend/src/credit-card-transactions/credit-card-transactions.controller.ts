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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreditCardTransactionsService } from './credit-card-transactions.service';
import {
  CreateCreditCardTransactionDto,
  UpdateCreditCardTransactionDto,
} from './dtos/credit-card-transaction.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth/types/auth-request.type';

@UseGuards(AuthGuard('jwt'))
@Controller('credit-card-transactions')
export class CreditCardTransactionsController {
  constructor(private readonly service: CreditCardTransactionsService) {}

  @Post()
  create(
    @Request() req: AuthRequest,
    @Body() createDto: CreateCreditCardTransactionDto,
  ) {
    // Apenas esta rota de criação é necessária
    return this.service.create(req.user.id, createDto);
  }

  @Get()
  findAll(
    @Request() req: AuthRequest,
    @Query('creditCardId') creditCardId?: string,
    @Query('status') status?: 'billed' | 'unbilled' | 'all',
    @Query('startDate') startDateString?: string,
    @Query('endDate') endDateString?: string,
  ) {
    // Converte as strings de data para objetos Date antes de chamar o service
    // Adicionamos T00:00:00 para evitar problemas de fuso horário
    const startDate = startDateString
      ? new Date(`${startDateString}T00:00:00`)
      : undefined;
    const endDate = endDateString
      ? new Date(`${endDateString}T00:00:00`)
      : undefined;

    return this.service.findAll(
      req.user.id,
      creditCardId,
      status,
      startDate,
      endDate,
    );
  }
  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.service.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateDto: UpdateCreditCardTransactionDto,
  ) {
    return this.service.update(req.user.id, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
