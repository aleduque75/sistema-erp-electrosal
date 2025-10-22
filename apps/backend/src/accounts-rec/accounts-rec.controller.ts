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
import { AccountsRecService } from './accounts-rec.service';
import {
  CreateAccountRecDto,
  UpdateAccountRecDto,
  ReceivePaymentDto,
} from './dtos/account-rec.dto';
import { PayAccountsRecWithMetalCreditDto } from './dtos/pay-accounts-rec-with-metal-credit.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PayAccountsRecWithMetalCreditUseCase } from './use-cases/pay-accounts-rec-with-metal-credit.use-case';
import { PayAccountsRecWithMetalDto } from './dtos/pay-accounts-rec-with-metal.dto';
import { PayAccountsRecWithMetalUseCase } from './use-cases/pay-accounts-rec-with-metal.use-case';

@UseGuards(AuthGuard('jwt'))
@Controller('accounts-rec')
export class AccountsRecController {
  constructor(
    private readonly accountsRecService: AccountsRecService,
    private readonly payAccountsRecWithMetalCreditUseCase: PayAccountsRecWithMetalCreditUseCase,
    private readonly payAccountsRecWithMetalUseCase: PayAccountsRecWithMetalUseCase,
  ) {}

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createDto: CreateAccountRecDto,
  ) {
    return this.accountsRecService.create(organizationId, createDto);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('status') status?: string,
  ) {
    return this.accountsRecService.findAll(organizationId, status);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.accountsRecService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountRecDto,
  ) {
    return this.accountsRecService.update(organizationId, id, updateDto);
  }

  @Patch(':id/receive')
  receive(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ReceivePaymentDto,
  ) {
    return this.accountsRecService.receive(organizationId, userId, id, dto);
  }

  @Patch(':id/pay-with-metal-credit')
  payWithMetalCredit(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') accountsRecId: string,
    @Body() dto: PayAccountsRecWithMetalCreditDto,
  ) {
    return this.payAccountsRecWithMetalCreditUseCase.execute(
      organizationId,
      userId,
      accountsRecId,
      dto,
    );
  }

  @Patch(':id/pay-with-metal')
  payWithMetal(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') accountsRecId: string,
    @Body() dto: PayAccountsRecWithMetalDto,
  ) {
    return this.payAccountsRecWithMetalUseCase.execute(
      organizationId,
      userId,
      accountsRecId,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.accountsRecService.remove(organizationId, id);
  }
}
