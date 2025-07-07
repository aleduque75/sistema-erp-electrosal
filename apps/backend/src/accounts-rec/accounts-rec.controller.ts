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
import { AccountsRecService } from './accounts-rec.service';
import { AuthGuard } from '@nestjs/passport';
import {
  CreateAccountRecDto,
  UpdateAccountRecDto,
  ReceivePaymentDto,
} from './dtos/account-rec.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('accounts-rec')
export class AccountsRecController {
  constructor(private readonly service: AccountsRecService) {}

  @Post()
  create(@Request() req, @Body() createDto: CreateAccountRecDto) {
    return this.service.create(req.user.id, createDto);
  }

  @Get()
  findAll(@Request() req, @Query('search') search?: string) {
    return this.service.findAll(req.user.id, search);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountRecDto,
  ) {
    return this.service.update(req.user.id, id, updateDto);
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
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
