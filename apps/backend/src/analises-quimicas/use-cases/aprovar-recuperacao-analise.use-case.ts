import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  IAnaliseQuimicaRepository,
  AnaliseQuimica,
} from '@sistema-erp-electrosal/core';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class AprovarRecuperacaoAnaliseUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepo: IAnaliseQuimicaRepository,
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
      // 1. Creditar conta de metal (lógica existente) - TEMPORARILY COMMENTED OUT
      /*
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
      */

      // 2. Criar registro de Contas a Receber (AccountRec)
      await tx.accountRec.create({
        data: {
          organizationId: command.organizationId,
          saleId: null, // Não é uma venda direta
          description: `Crédito de Análise Química Nº ${analise.numeroAnalise}`,
          amount: new Decimal(valorACreditar).toDecimalPlaces(2), // Converter gramas para valor financeiro (assumindo 1g Au = 1 unidade monetária por enquanto)
          dueDate: new Date(), // Vencimento hoje
          received: false, // Ainda não foi recebido/utilizado
          createdAt: new Date(),
          updatedAt: new Date(),
          // TODO: Definir conta corrente ou conta contábil se aplicável
        },
      });
    });

    return this.analiseRepo.save(analise, command.organizationId);
  }
}
