import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AuthRequest } from '../auth/types/auth-request.type';
import { ContasCorrentesService } from './contas-correntes.service';
import {
  CreateContaCorrenteDto,
  UpdateContaCorrenteDto,
} from './dtos/contas-correntes.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransacoesService } from '../transacoes/transacoes.service';

@UseGuards(JwtAuthGuard)
@Controller('contas-correntes')
export class ContasCorrentesController {
  constructor(
    private readonly contasCorrentesService: ContasCorrentesService,
    private readonly transacoesService: TransacoesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthRequest,
    @Body() createContaCorrenteDto: CreateContaCorrenteDto,
  ) {
    return this.contasCorrentesService.create(
      req.user.id,
      createContaCorrenteDto,
    );
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.contasCorrentesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.contasCorrentesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateContaCorrenteDto: UpdateContaCorrenteDto,
  ) {
    return this.contasCorrentesService.update(
      req.user.id,
      id,
      updateContaCorrenteDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.contasCorrentesService.remove(req.user.id, id);
  }

  @Get(':id/extrato')
  async getExtract(
    @Req() req: AuthRequest,
    @Param('id') contaCorrenteId: string,
    @Query('startDate') startDateString: string,
    @Query('endDate') endDateString: string,
  ) {
    const userId = req.user.id;

    // Garante que a conta existe e pertence ao usuário
    const contaCorrente = await this.contasCorrentesService.findOne(
      userId,
      contaCorrenteId,
    );

    const startDate = new Date(startDateString || '1970-01-01');
    const endDate = new Date(endDateString || new Date());

    // 1. Pega o saldo inicial de forma precisa com o novo método
    const saldoAnterior = await this.contasCorrentesService.getOpeningBalance(
      contaCorrenteId,
      startDate,
    );

    // 2. Busca apenas as transações do período selecionado
    const transacoes = await this.transacoesService.findExtract(
      userId,
      contaCorrenteId,
      startDate,
      endDate,
    );

    // 3. Calcula o saldo final a partir do saldo anterior
    let saldoFinal = saldoAnterior;
    for (const transacao of transacoes) {
      if (transacao.tipo === 'CREDITO') {
        saldoFinal += transacao.valor.toNumber();
      } else {
        // DEBITO
        saldoFinal -= transacao.valor.toNumber();
      }
    }

    return {
      contaCorrente,
      saldoAnterior,
      transacoes,
      saldoFinal,
    };
  }
}
