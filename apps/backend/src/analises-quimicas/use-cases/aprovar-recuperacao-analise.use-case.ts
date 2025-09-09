import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  IAnaliseQuimicaRepository,
  AnaliseQuimica,
  IContaMetalRepository,
  TipoMetal,
  ContaMetal,
} from '@sistema-erp-electrosal/core';
import { PrismaService } from '../../prisma/prisma.service';

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

    analise.aprovarRecuperacao();
    const valorACreditar = analise.auLiquidoParaClienteGramas;

    if (!valorACreditar || valorACreditar <= 0) {
      return this.analiseRepo.save(analise, command.organizationId);
    }

    await this.prisma.$transaction(async (tx) => {
      let contaCliente = await this.contaMetalRepo.findByPessoaIdAndMetal(
        analise.clienteId,
        TipoMetal.OURO,
        tx,
      );

      if (!contaCliente) {
        contaCliente = ContaMetal.criar({
          pessoaId: analise.clienteId,
          tipoMetal: TipoMetal.OURO,
        });
        await this.contaMetalRepo.create(contaCliente, tx);
      }

      contaCliente.creditar({
        data: new Date(),
        gramas: valorACreditar,
        origemId: analise.id,
        origemTipo: 'AnaliseQuimica',
        observacao: `Crédito da Análise Nº ${analise.numeroAnalise}`,
      });
      await this.contaMetalRepo.save(contaCliente, tx);
    });

    return this.analiseRepo.save(analise, command.organizationId);
  }
}
