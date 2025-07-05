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
} from '@nestjs/common';
import { AuthRequest } from '../auth/types/auth-request.type';
import { AccountsPayService } from './accounts-pay.service';
import {
  CreateAccountPayDto,
  UpdateAccountPayDto,
  PayAccountDto,
} from './dtos/account-pay.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('accounts-pay')
export class AccountsPayController {
  constructor(private readonly accountsPayService: AccountsPayService) {}

  @Post()
  create(
    @Request() req: AuthRequest,
    @Body() createAccountPayDto: CreateAccountPayDto,
  ) {
    return this.accountsPayService.create(req.user.id, createAccountPayDto);
  }

  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.accountsPayService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.accountsPayService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateAccountPayDto: UpdateAccountPayDto,
  ) {
    return this.accountsPayService.update(req.user.id, id, updateAccountPayDto);
  }

  @Delete(':id')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.accountsPayService.remove(req.user.id, id);
  }
  @Post(':id/pay')
  pay(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() payAccountDto: PayAccountDto,
  ) {
    return this.accountsPayService.pay(req.user.id, id, payAccountDto);
  }
}
