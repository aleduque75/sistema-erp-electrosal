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
import {
  CreateTransacaoDto,
  UpdateTransacaoDto,
  CreateBulkTransacoesDto,
} from './dtos/create-transacao.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('transacoes')
export class TransacoesController {
  constructor(private readonly transacoesService: TransacoesService) {}

  @Post('bulk-create')
  createMany(
    @CurrentUser('orgId') organizationId: string,
    @Body() createBulkDto: CreateBulkTransacoesDto,
  ) {
    return this.transacoesService.createMany(organizationId, createBulkDto);
  }

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createTransacaoDto: CreateTransacaoDto,
  ) {
    return this.transacoesService.create(createTransacaoDto, organizationId);
  }

  @Get()
  findAll(@CurrentUser('orgId') organizationId: string) {
    return this.transacoesService.findAll(organizationId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.transacoesService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateTransacaoDto: UpdateTransacaoDto,
  ) {
    return this.transacoesService.update(
      organizationId,
      id,
      updateTransacaoDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.transacoesService.remove(organizationId, id);
  }
}
