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
} from '@nestjs/common';
import { AccountsPayService } from './accounts-pay.service';
import {
  CreateAccountPayDto,
  UpdateAccountPayDto,
  PayAccountDto,
} from './dtos/account-pay.dto';
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

  @Get()
  findAll(@CurrentUser('orgId') organizationId: string) {
    // <-- Pega o orgId do token
    return this.accountsPayService.findAll(organizationId); // <-- Passa o orgId para o serviço
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
    @Param('id') id: string,
    @Body() payDto: PayAccountDto,
  ) {
    return this.accountsPayService.pay(organizationId, id, payDto);
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
