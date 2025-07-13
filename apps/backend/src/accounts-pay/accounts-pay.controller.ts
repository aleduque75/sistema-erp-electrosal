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
import { AccountsPayService } from './accounts-pay.service';
import {
  CreateAccountPayDto,
  UpdateAccountPayDto,
  PayAccountDto,
} from './dtos/account-pay.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth/types/auth-request.type';

@UseGuards(AuthGuard('jwt'))
@Controller('accounts-pay')
export class AccountsPayController {
  constructor(private readonly accountsPayService: AccountsPayService) {}

  @Post()
  create(@Request() req: AuthRequest, @Body() createDto: CreateAccountPayDto) {
    return this.accountsPayService.create(req.user.id, createDto);
  }

  @Get()
  findAll(
    @Request() req: AuthRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountsPayService.findAll(req.user.id, startDate, endDate);
  }

  @Get('summary/by-category')
  getSummaryByCategory(@Request() req: AuthRequest) {
    return this.accountsPayService.getSummaryByCategory(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.accountsPayService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountPayDto,
  ) {
    return this.accountsPayService.update(req.user.id, id, updateDto);
  }

  @Post(':id/pay')
  pay(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() payDto: PayAccountDto,
  ) {
    return this.accountsPayService.pay(req.user.id, id, payDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.accountsPayService.remove(req.user.id, id);
  }
}
