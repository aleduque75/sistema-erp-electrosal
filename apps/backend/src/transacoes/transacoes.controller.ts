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
import { TransacoesService } from './transacoes.service';
import { CreateTransacaoDto } from './dtos/create-transacao.dto';
import { UpdateTransacaoDto } from './dtos/update-transacao.dto';
import { BulkCreateTransacaoDto } from './dtos/bulk-create-transacao.dto';
import { BulkUpdateTransacaoDto } from './dtos/bulk-update-transacao.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTransferDto } from './dtos/create-transfer.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('transacoes')
export class TransacoesController {
  constructor(private readonly transacoesService: TransacoesService) {}

  @Post()
  create(
    @Body() createTransacaoDto: CreateTransacaoDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.transacoesService.create(createTransacaoDto, organizationId);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.CREATED)
  async createTransfer(
    @CurrentUser('orgId') organizationId: string,
    @Body() createTransferDto: CreateTransferDto,
  ) {
    return this.transacoesService.createTransfer(organizationId, createTransferDto);
  }

  @Post('/bulk-create')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreate(
    @Body() bulkCreateDto: BulkCreateTransacaoDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.transacoesService.createMany(bulkCreateDto, organizationId);
  }

  @Get()
  findAll(@CurrentUser('orgId') organizationId: string) {
    // This needs to be implemented in the service
    // return this.transacoesService.findAll(organizationId);
    return []; // Placeholder
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.transacoesService.findOne(id, organizationId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransacaoDto: UpdateTransacaoDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.transacoesService.update(id, updateTransacaoDto, organizationId);
  }

  @Post('bulk-update-conta-contabil')
  bulkUpdateContaContabil(
    @Body() bulkUpdateDto: BulkUpdateTransacaoDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.transacoesService.bulkUpdateContaContabil(bulkUpdateDto.transactionIds, bulkUpdateDto.contaContabilId, organizationId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.transacoesService.remove(id, organizationId);
  }
}