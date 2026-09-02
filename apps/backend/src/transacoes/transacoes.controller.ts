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
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTransacaoDto } from './dtos/create-transacao.dto';
import { UpdateTransacaoDto } from './dtos/update-transacao.dto';
import { CreateTransferDto } from './dtos/create-transfer.dto';
import { BulkCreateTransacaoDto } from './dtos/bulk-create-transacao.dto';
import { BulkUpdateTransacaoDto } from './dtos/bulk-update-transacao.dto';
import { GenericBulkUpdateTransacaoDto } from './dtos/generic-bulk-update-transacao.dto';
import { AdjustTransactionDto } from './dtos/adjust-transacao.dto';
import { CreateTransacaoUseCase } from './use-cases/create-transacao.use-case';
import { CreateTransferUseCase } from './use-cases/create-transfer.use-case';
import { UpdateTransacaoUseCase } from './use-cases/update-transacao.use-case';
import { DeleteTransacaoUseCase } from './use-cases/delete-transacao.use-case';
import { ListTransacoesUseCase } from './use-cases/list-transacoes.use-case';
import { GetTransacaoUseCase } from './use-cases/get-transacao.use-case';
import { FindUnlinkedTransacoesUseCase } from './use-cases/find-unlinked-transacoes.use-case';
import { LinkAccountUseCase } from './use-cases/link-account.use-case';
import { BulkCreateTransacoesUseCase } from './use-cases/bulk-create-transacoes.use-case';
import { BulkUpdateTransacoesUseCase } from './use-cases/bulk-update-transacoes.use-case';
import { UpdateTransactionUseCase } from './use-cases/update-transaction.use-case';

@UseGuards(AuthGuard('jwt'))
@Controller('transacoes')
export class TransacoesController {
  constructor(
    private readonly createTransacaoUseCase: CreateTransacaoUseCase,
    private readonly createTransferUseCase: CreateTransferUseCase,
    private readonly updateTransacaoUseCase: UpdateTransacaoUseCase,
    private readonly deleteTransacaoUseCase: DeleteTransacaoUseCase,
    private readonly listTransacoesUseCase: ListTransacoesUseCase,
    private readonly getTransacaoUseCase: GetTransacaoUseCase,
    private readonly findUnlinkedTransacoesUseCase: FindUnlinkedTransacoesUseCase,
    private readonly linkAccountUseCase: LinkAccountUseCase,
    private readonly bulkCreateTransacoesUseCase: BulkCreateTransacoesUseCase,
    private readonly bulkUpdateTransacoesUseCase: BulkUpdateTransacoesUseCase,
    private readonly updateTransactionUseCase: UpdateTransactionUseCase,
  ) {}

  @Post()
  create(
    @Body() createTransacaoDto: CreateTransacaoDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.createTransacaoUseCase.execute(createTransacaoDto, organizationId);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.CREATED)
  async createTransfer(
    @CurrentUser('orgId') organizationId: string,
    @Body() createTransferDto: CreateTransferDto,
  ) {
    return this.createTransferUseCase.execute(organizationId, createTransferDto);
  }

  @Post('/bulk-create')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreate(
    @Body() bulkCreateDto: BulkCreateTransacaoDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.bulkCreateTransacoesUseCase.execute(bulkCreateDto, organizationId);
  }

  @Post('bulk-update')
  bulkUpdate(
    @Body() bulkUpdateDto: GenericBulkUpdateTransacaoDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.bulkUpdateTransacoesUseCase.execute(bulkUpdateDto, organizationId);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.listTransacoesUseCase.execute(organizationId, startDate, endDate);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.getTransacaoUseCase.execute(id, organizationId);
  }

  @Get('unlinked/all')
  findUnlinked(@CurrentUser('orgId') organizationId: string) {
    return this.findUnlinkedTransacoesUseCase.execute(organizationId);
  }

  @Patch(':id/adjust')
  adjust(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() adjustTransactionDto: AdjustTransactionDto,
  ) {
    return this.updateTransactionUseCase.execute({
      transactionId: id,
      organizationId,
      ...adjustTransactionDto,
    });
  }

  @Patch(':id/link-account')
  linkAccount(
    @Param('id') id: string,
    @CurrentUser('orgId') organizationId: string,
    @Body() body: { contaCorrenteId: string },
  ) {
    return this.linkAccountUseCase.execute(organizationId, id, body.contaCorrenteId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransacaoDto: UpdateTransacaoDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.updateTransacaoUseCase.execute(id, updateTransacaoDto, organizationId);
  }

  @Post('bulk-update-conta-contabil')
  bulkUpdateContaContabil(
    @Body() bulkUpdateDto: BulkUpdateTransacaoDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.bulkUpdateTransacoesUseCase.executeContaContabil(
      bulkUpdateDto.transactionIds,
      bulkUpdateDto.contaContabilId,
      organizationId,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.deleteTransacaoUseCase.execute(id, organizationId);
  }
}