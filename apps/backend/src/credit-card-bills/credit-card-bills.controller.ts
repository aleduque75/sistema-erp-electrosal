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
  CreateBillFromTransactionsDto,
  UpdateCreditCardBillDto,
  PayCreditCardBillDto,
} from './dtos/credit-card-bill.dto';
import { AuthGuard } from '@nestjs/passport';
// MELHORIA: Usando caminho relativo para mais robustez
import { AuthRequest } from '../auth/types/auth-request.type';

@UseGuards(AuthGuard('jwt'))
@Controller('credit-card-bills')
export class CreditCardBillsController {
  // Usamos 'service' como nome padrão para consistência
  constructor(private readonly service: CreditCardBillsService) {}

  @Post('from-transactions')
  createFromTransactions(
    @Request() req: AuthRequest,
    @Body() createDto: CreateBillFromTransactionsDto,
  ) {
    return this.service.createFromTransactions(req.user.id, createDto);
  }

  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.service.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.service.findOne(req.user.id, id);
  }

  // <<< CORREÇÃO: Removida a função 'pay' duplicada >>>
  // Apenas uma rota POST para a ação de pagar.
  @Post(':id/pay')
  pay(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() payDto: PayCreditCardBillDto,
  ) {
    // CORREÇÃO: Usando 'this.service' consistentemente
    return this.service.pay(req.user.id, id, payDto);
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateDto: UpdateCreditCardBillDto,
  ) {
    return this.service.update(req.user.id, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
