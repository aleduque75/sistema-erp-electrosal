import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  AnaliseQuimica,
  ContaMetal,
  IAnaliseQuimicaRepository,
  IContaMetalRepository,
  TipoMetal,
} from '@sistema-erp-electrosal/core';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class AprovarRecuperacaoAnaliseUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepo: IAnaliseQuimicaRepository,
    @Inject('IContaMetalRepository')
    private readonly contaMetalRepo: IContaMetalRepository,
  ) {}

  async execute(command: { id: string, organizationId: string }): Promise<AnaliseQuimica> {
    const analise = await this.analiseRepo.findById(command.id, command.organizationId);
    if (!analise)
      throw new NotFoundException(
        `Análise com ID ${command.id} não encontrada.`,
      );

    analise.aprovarParaRecuperacao();
    const valorACreditar = analise.auLiquidoParaClienteGramas;

    if (!valorACreditar || valorACreditar <= 0) {
      return this.analiseRepo.save(analise, command.organizationId);
    }

    await this.prisma.$transaction(async (tx) => {
      // Lógica correta: Credita o metal na conta de metal do cliente
      let contaCliente = await this.contaMetalRepo.findByPessoaIdAndMetal(
        analise.clienteId,
        TipoMetal.OURO,
        command.organizationId,
        tx,
      );

      if (!contaCliente) {
        contaCliente = ContaMetal.create({
          pessoaId: analise.clienteId,
          tipoMetal: TipoMetal.OURO,
          organizationId: command.organizationId,
        });
        await this.contaMetalRepo.create(contaCliente, tx);
      }

      contaCliente.creditar({
        data: new Date(),
        gramas: valorACreditar,
        origemId: analise.id.toString(),
        origemTipo: 'AnaliseQuimica',
        observacao: `Crédito da Análise Nº ${analise.numeroAnalise}`,
      });
      await this.contaMetalRepo.save(contaCliente, tx);
    });

    return this.analiseRepo.save(analise, command.organizationId);
  }
}
