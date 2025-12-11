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
import { AccountsPayService } from './accounts-pay.service';
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

@UseGuards(AuthGuard('jwt'))
@Controller('accounts-pay')
export class AccountsPayController {
  constructor(private readonly accountsPayService: AccountsPayService) {}

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createDto: CreateAccountPayDto,
  ) {
    return this.accountsPayService.create(organizationId, createDto);
  }

  @Post('bulk-create-from-transactions')
  bulkCreateFromTransactions(
    @CurrentUser('orgId') organizationId: string,
    @Body() dto: BulkCreateFromTransactionsDto,
  ) {
    return this.accountsPayService.bulkCreateFromTransactions(organizationId, dto.transactionIds);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: 'pending' | 'paid' | 'all',
  ) {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    return this.accountsPayService.findAll(
      organizationId,
      parsedStartDate,
      parsedEndDate,
      status,
    );
  }

  @Get('summary/by-category')
  getSummaryByCategory(@CurrentUser('orgId') organizationId: string) {
    return this.accountsPayService.getSummaryByCategory(organizationId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.accountsPayService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountPayDto,
  ) {
    return this.accountsPayService.update(organizationId, id, updateDto);
  }

  @Post(':id/pay')
  pay(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string, // Changed from 'sub' to 'id'
    @Param('id') id: string,
    @Body() payDto: PayAccountDto,
  ) {
    return this.accountsPayService.pay(organizationId, userId, id, payDto); // Pass userId
  }

  @Post(':id/pay-with-metal')
  payWithMetal(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() payWithMetalDto: PayWithMetalDto,
  ) {
    return this.accountsPayService.payWithMetal(organizationId, userId, id, payWithMetalDto);
  }

  @Post(':id/split')
  splitIntoInstallments(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() splitDto: SplitAccountPayDto,
  ) {
    return this.accountsPayService.splitIntoInstallments(
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
    return this.accountsPayService.remove(organizationId, id);
  }
}