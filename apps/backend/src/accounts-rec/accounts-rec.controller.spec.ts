import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AccountsRecService } from './accounts-rec.service';
import { AuthGuard } from '@nestjs/passport';
// ✅ CORREÇÃO: Importando todas as DTOs do arquivo unificado
import { ReceivePaymentDto } from './dtos/account-rec.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('accounts-rec')
export class AccountsRecController {
  constructor(private readonly service: AccountsRecService) {}

  @Get()
  findAll(@Request() req, @Query('search') search?: string) {
    return this.service.findAll(req.user.id, search);
  }

  @Patch(':id/receive')
  receive(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReceivePaymentDto,
  ) {
    return this.service.receive(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
