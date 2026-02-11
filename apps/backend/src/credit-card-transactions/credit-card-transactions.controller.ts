import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CreditCardTransactionsService } from './credit-card-transactions.service';
import {
  CreateCreditCardTransactionDto,
  UpdateCreditCardTransactionDto,
} from './dtos/credit-card-transaction.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('credit-card-transactions')
export class CreditCardTransactionsController {
  constructor(private readonly service: CreditCardTransactionsService) {}

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createDto: CreateCreditCardTransactionDto,
  ) {
    return this.service.create(organizationId, createDto);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('creditCardId') creditCardId?: string,
  ) {
    return this.service.findAll(organizationId, creditCardId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateCreditCardTransactionDto,
  ) {
    return this.service.update(organizationId, id, updateDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(organizationId, id);
  }
}
