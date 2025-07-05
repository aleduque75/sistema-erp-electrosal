// apps/backend/src/accounts-rec/accounts-rec.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch, // Importe Patch
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AccountsRecService } from './accounts-rec.service';
import {
  CreateAccountRecDto,
  UpdateAccountRecDto,
  ReceivePaymentDto, // Garanta que ReceivePaymentDto está importado
} from './dtos/account-rec.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth/types/auth-request.type';

@UseGuards(AuthGuard('jwt'))
@Controller('accounts-rec')
export class AccountsRecController {
  constructor(private readonly accountsRecService: AccountsRecService) {}

  @Post()
  create(
    @Request() req: AuthRequest,
    @Body() createAccountRecDto: CreateAccountRecDto,
  ) {
    return this.accountsRecService.create(req.user.id, createAccountRecDto);
  }

  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.accountsRecService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.accountsRecService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateAccountRecDto: UpdateAccountRecDto,
  ) {
    return this.accountsRecService.update(req.user.id, id, updateAccountRecDto);
  }

  @Delete(':id')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.accountsRecService.remove(req.user.id, id);
  }

  // NOVO: Rota para marcar como recebido
  @Patch(':id/receive') // <--- MÉTODO HTTP PATCH, Rota: /accounts-rec/:id/receive
  markAsReceived(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() receivePaymentDto: ReceivePaymentDto, // Recebe o DTO com receivedAt e contaCorrenteId
  ) {
    // Chama o método markAsReceived do serviço
    return this.accountsRecService.markAsReceived(
      req.user.id,
      id,
      receivePaymentDto,
    );
  }
}
