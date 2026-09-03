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
  CreateAccountRecDto,
  UpdateAccountRecDto,
  ReceivePaymentDto,
} from './dtos/account-rec.dto';
import { PayAccountsRecWithMetalCreditDto } from './dtos/pay-accounts-rec-with-metal-credit.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateAccountRecUseCase } from './use-cases/create-account-rec.use-case';
import { ListAccountsRecUseCase } from './use-cases/list-accounts-rec.use-case';
import { GetAccountRecByIdUseCase } from './use-cases/get-account-rec-by-id.use-case';
import { UpdateAccountRecUseCase } from './use-cases/update-account-rec.use-case';
import { DeleteAccountRecUseCase } from './use-cases/delete-account-rec.use-case';
import { ReceiveAccountRecPaymentUseCase } from './use-cases/receive-account-rec-payment.use-case';
import { ForceFinalizeAccountRecUseCase } from './use-cases/force-finalize-account-rec.use-case';
import { PayAccountsRecWithMetalCreditUseCase } from './use-cases/pay-accounts-rec-with-metal-credit.use-case';
import { PayAccountsRecWithMetalDto } from './dtos/pay-accounts-rec-with-metal.dto';
import { PayAccountsRecWithMetalUseCase } from './use-cases/pay-accounts-rec-with-metal.use-case';
import { PayAccountsRecWithMetalCreditMultipleDto } from './dtos/pay-accounts-rec-with-metal-credit-multiple.dto';
import { PayAccountsRecWithMetalCreditMultipleUseCase } from './use-cases/pay-accounts-rec-with-metal-credit-multiple.use-case';
import { PayAccountsRecWithMetalMultipleDto } from './dtos/pay-accounts-rec-with-metal-multiple.dto';
import { PayAccountsRecWithMetalMultipleUseCase } from './use-cases/pay-accounts-rec-with-metal-multiple.use-case';
import { HybridReceiveDto } from './dtos/hybrid-receive.dto';
import { HybridReceiveUseCase } from './use-cases/hybrid-receive.use-case';

@UseGuards(AuthGuard('jwt'))
@Controller('accounts-rec')
export class AccountsRecController {
  constructor(
    private readonly createAccountRecUseCase: CreateAccountRecUseCase,
    private readonly listAccountsRecUseCase: ListAccountsRecUseCase,
    private readonly getAccountRecByIdUseCase: GetAccountRecByIdUseCase,
    private readonly updateAccountRecUseCase: UpdateAccountRecUseCase,
    private readonly deleteAccountRecUseCase: DeleteAccountRecUseCase,
    private readonly receiveAccountRecPaymentUseCase: ReceiveAccountRecPaymentUseCase,
    private readonly forceFinalizeAccountRecUseCase: ForceFinalizeAccountRecUseCase,
    private readonly payAccountsRecWithMetalCreditUseCase: PayAccountsRecWithMetalCreditUseCase,
    private readonly payAccountsRecWithMetalUseCase: PayAccountsRecWithMetalUseCase,
    private readonly payAccountsRecWithMetalCreditMultipleUseCase: PayAccountsRecWithMetalCreditMultipleUseCase,
    private readonly payAccountsRecWithMetalMultipleUseCase: PayAccountsRecWithMetalMultipleUseCase,
    private readonly hybridReceiveUseCase: HybridReceiveUseCase,
  ) {}

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createDto: CreateAccountRecDto,
  ) {
    return this.createAccountRecUseCase.execute(organizationId, createDto);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('status') status?: string,
  ) {
    return this.listAccountsRecUseCase.execute(organizationId, status);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.getAccountRecByIdUseCase.execute(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountRecDto,
  ) {
    return this.updateAccountRecUseCase.execute(organizationId, id, updateDto);
  }

  @Post(':id/hybrid-receive')
  hybridReceive(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') accountsRecId: string,
    @Body() dto: HybridReceiveDto,
  ) {
    return this.hybridReceiveUseCase.execute(
      organizationId,
      userId,
      accountsRecId,
      dto,
    );
  }

  @Patch(':id/receive')
  receive(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ReceivePaymentDto,
  ) {
    return this.receiveAccountRecPaymentUseCase.execute(organizationId, userId, id, dto);
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

  @Patch(':id/pay-with-metal-credit-multiple')
  payWithMetalCreditMultiple(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') accountsRecId: string,
    @Body() dto: PayAccountsRecWithMetalCreditMultipleDto,
  ) {
    return this.payAccountsRecWithMetalCreditMultipleUseCase.execute(
      organizationId,
      userId,
      accountsRecId,
      dto,
    );
  }

  @Patch(':id/pay-with-metal-multiple')
  payWithMetalMultiple(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') accountsRecId: string,
    @Body() dto: PayAccountsRecWithMetalMultipleDto,
  ) {
    return this.payAccountsRecWithMetalMultipleUseCase.execute(
      organizationId,
      userId,
      accountsRecId,
      dto,
    );
  }

  @Patch(':id/force-finalize')
  forceFinalize(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.forceFinalizeAccountRecUseCase.execute(organizationId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.deleteAccountRecUseCase.execute(organizationId, id);
  }
}
