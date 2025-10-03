import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger, // ADDED
} from '@nestjs/common';
import {
  AnaliseQuimica,
  MetalAccount,
  IAnaliseQuimicaRepository,
  IMetalAccountRepository,
  TipoMetal,
} from '@sistema-erp-electrosal/core';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class AprovarRecuperacaoAnaliseUseCase {
  private readonly logger = new Logger(AprovarRecuperacaoAnaliseUseCase.name); // ADDED
  constructor(
    private readonly prisma: PrismaService,
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepo: IAnaliseQuimicaRepository,
    @Inject('IMetalAccountRepository')
    private readonly contaMetalRepo: IMetalAccountRepository,
  ) {}

  async execute(command: { id: string, organizationId: string }): Promise<AnaliseQuimica> {
    const analise = await this.analiseRepo.findById(command.id, command.organizationId);
    if (!analise)
      throw new NotFoundException(
        `Análise com ID ${command.id} não encontrada.`,
      );

    if (!analise.clienteId) {
      throw new BadRequestException('Análise Química não possui um cliente associado.');
    }

    analise.aprovarParaRecuperacao();
    let valorACreditar: number | null = null; // MODIFIED to be mutable

    // ADDED DEBUG LOGS
    this.logger.debug(`Analise ID: ${analise.id}`);
    this.logger.debug(`clienteId: ${analise.clienteId}`);
    this.logger.debug(`volumeOuPesoEntrada: ${analise.volumeOuPesoEntrada}`);
    this.logger.debug(`auLiquidoParaClienteGramas: ${analise.auLiquidoParaClienteGramas}`);

    if (analise.clienteId === 'SYSTEM_RESIDUE') { // ADDED logic for RESIDUE
      valorACreditar = analise.volumeOuPesoEntrada;
    } else {
      valorACreditar = analise.auLiquidoParaClienteGramas;
    }

    if (!valorACreditar || valorACreditar <= 0) {
      return this.analiseRepo.save(analise, command.organizationId);
    }

    await this.prisma.$transaction(async (tx) => {
      // Lógica correta: Credita o metal na conta de metal do cliente
      let contaCliente = await this.contaMetalRepo.findByPessoaIdAndMetal(
        analise.clienteId,
        TipoMetal.AU,
        command.organizationId,
        tx,
      );

      if (!contaCliente) {
        contaCliente = MetalAccount.create({
          pessoaId: analise.clienteId,
          name: analise.clienteId, // Using clienteId as name for now, assuming it's a client-specific account
          metalType: TipoMetal.AU,
          organizationId: command.organizationId,
        });
        await this.contaMetalRepo.create(contaCliente, tx);
      }

      contaCliente.credit({ // MODIFIED to use the updated credit method
        gramas: valorACreditar,
        data: new Date(),
        origemId: analise.id.toString(),
        origemTipo: 'AnaliseQuimica',
        observacao: `Crédito da Análise Nº ${analise.numeroAnalise}`,
      });
      await this.contaMetalRepo.save(contaCliente, tx);
    });

    return this.analiseRepo.save(analise, command.organizationId);
  }
}
