import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  CreateAccountPayDto,
  UpdateAccountPayDto,
  PayAccountDto,
  SplitAccountPayDto,
  PayWithMetalDto,
} from './dtos/account-pay.dto';
import { BulkCreateFromTransactionsDto } from './dtos/bulk-create-from-transactions.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateAccountPayUseCase } from './use-cases/create-account-pay.use-case';
import { ListAccountsPayUseCase } from './use-cases/list-accounts-pay.use-case';
import { GetAccountPayByIdUseCase } from './use-cases/get-account-pay-by-id.use-case';
import { UpdateAccountPayUseCase } from './use-cases/update-account-pay.use-case';
import { DeleteAccountPayUseCase } from './use-cases/delete-account-pay.use-case';
import { PayAccountPayUseCase } from './use-cases/pay-account-pay.use-case';
import { PayAccountPayWithMetalUseCase } from './use-cases/pay-account-pay-with-metal.use-case';
import { SplitAccountPayInstallmentsUseCase } from './use-cases/split-account-pay-installments.use-case';
import { BulkCreateAccountsPayFromTransactionsUseCase } from './use-cases/bulk-create-accounts-pay-from-transactions.use-case';
import { GetAccountsPaySummaryByCategoryUseCase } from './use-cases/get-accounts-pay-summary-by-category.use-case';

@UseGuards(AuthGuard('jwt'))
@Controller('accounts-pay')
export class AccountsPayController {
  constructor(
    private readonly createAccountPayUseCase: CreateAccountPayUseCase,
    private readonly listAccountsPayUseCase: ListAccountsPayUseCase,
    private readonly getAccountPayByIdUseCase: GetAccountPayByIdUseCase,
    private readonly updateAccountPayUseCase: UpdateAccountPayUseCase,
    private readonly deleteAccountPayUseCase: DeleteAccountPayUseCase,
    private readonly payAccountPayUseCase: PayAccountPayUseCase,
    private readonly payAccountPayWithMetalUseCase: PayAccountPayWithMetalUseCase,
    private readonly splitAccountPayInstallmentsUseCase: SplitAccountPayInstallmentsUseCase,
    private readonly bulkCreateAccountsPayFromTransactionsUseCase: BulkCreateAccountsPayFromTransactionsUseCase,
    private readonly getAccountsPaySummaryByCategoryUseCase: GetAccountsPaySummaryByCategoryUseCase,
  ) {}

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createDto: CreateAccountPayDto,
  ) {
    return this.createAccountPayUseCase.execute(organizationId, createDto);
  }

  @Post('bulk-create-from-transactions')
  bulkCreateFromTransactions(
    @CurrentUser('orgId') organizationId: string,
    @Body() dto: BulkCreateFromTransactionsDto,
  ) {
    return this.bulkCreateAccountsPayFromTransactionsUseCase.execute(organizationId, dto.transactionIds);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: 'pending' | 'paid' | 'all',
    @Query('description') description?: string,
    @Query('fornecedorId') fornecedorId?: string,
  ) {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    return this.listAccountsPayUseCase.execute({
      organizationId,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      status,
      description,
      fornecedorId,
    });
  }

  @Get('summary/by-category')
  getSummaryByCategory(@CurrentUser('orgId') organizationId: string) {
    return this.getAccountsPaySummaryByCategoryUseCase.execute(organizationId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.getAccountPayByIdUseCase.execute(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountPayDto,
  ) {
    return this.updateAccountPayUseCase.execute(organizationId, id, updateDto);
  }

  @Post(':id/pay')
  pay(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() payDto: PayAccountDto,
  ) {
    return this.payAccountPayUseCase.execute(organizationId, userId, id, payDto);
  }

  @Post(':id/pay-with-metal')
  payWithMetal(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() payWithMetalDto: PayWithMetalDto,
  ) {
    return this.payAccountPayWithMetalUseCase.execute(organizationId, userId, id, payWithMetalDto);
  }

  @Post(':id/split')
  splitIntoInstallments(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() splitDto: SplitAccountPayDto,
  ) {
    return this.splitAccountPayInstallmentsUseCase.execute(
      organizationId,
      id,
      splitDto.numberOfInstallments,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.deleteAccountPayUseCase.execute(organizationId, id);
  }
}