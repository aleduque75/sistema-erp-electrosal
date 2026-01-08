import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { StatusAnaliseQuimica } from '@sistema-erp-electrosal/core/domain/enums/status-analise-quimica.enum';
import {
  IAnaliseQuimicaRepository,
  IMetalCreditRepository,
  MetalCredit,
} from '@sistema-erp-electrosal/core';
import { PrismaService } from '../../prisma/prisma.service'; // Import PrismaService

export interface AprovarAnaliseCommand {
  analiseId: string;
  organizationId: string;
}

@Injectable()
export class AprovarAnaliseUseCase {
  private readonly logger = new Logger(AprovarAnaliseUseCase.name);
  constructor(
    @Inject('IAnaliseQuimicaRepository')
    private readonly analiseRepository: IAnaliseQuimicaRepository,
    @Inject('IMetalCreditRepository')
    private readonly metalCreditRepository: IMetalCreditRepository,
    private readonly prisma: PrismaService, // Inject PrismaService
  ) {}

  async execute(command: AprovarAnaliseCommand): Promise<void> {
    const { analiseId, organizationId } = command;

    const analise = await this.analiseRepository.findById(
      analiseId,
      organizationId,
    );

    if (!analise) {
      throw new NotFoundException(
        `Análise química com ID ${analiseId} não encontrada.`,
      );
    }

    if (analise.status !== StatusAnaliseQuimica.ANALISADO_AGUARDANDO_APROVACAO) {
      throw new ConflictException(
        `Análise não pode ser aprovada pois não está aguardando aprovação.`,
      );
    }

    analise.aprovarParaRecuperacao();

    this.logger.debug(`[APROVAR_ANALISE] Criando MetalCredit para analise ${analise.id.toString()} com metalType: ${analise.metalType}`);

    const creditDate = analise.dataAnaliseConcluida || analise.dataEntrada || new Date();

    const metalCredit = MetalCredit.create({
      clientId: analise.clienteId,
      chemicalAnalysisId: analise.id.toString(),
      metalType: analise.metalType, // FIX: Use dynamic metalType from analysis
      grams: analise.auLiquidoParaClienteGramas || 0,
      date: creditDate,
      organizationId: organizationId,
    });

    await this.metalCreditRepository.create(metalCredit);

    // --- Logic to create MetalAccount and MetalAccountEntry ---
    let metalAccount = await this.prisma.metalAccount.findUnique({
      where: {
        organizationId_personId_type: {
          organizationId: organizationId,
          personId: analise.clienteId,
          type: analise.metalType,
        },
      },
    });

    if (!metalAccount) {
      this.logger.debug(`[APROVAR_ANALISE] Criando MetalAccount para cliente ${analise.clienteId} e metal ${analise.metalType}`);
      metalAccount = await this.prisma.metalAccount.create({
        data: {
          organizationId: organizationId,
          personId: analise.clienteId,
          type: analise.metalType,
        },
      });
    }

    this.logger.debug(`[APROVAR_ANALISE] Criando MetalAccountEntry de CRÉDITO para MetalAccount ${metalAccount.id}`);
    await this.prisma.metalAccountEntry.create({
      data: {
        metalAccountId: metalAccount.id,
        date: creditDate,
        description: `Crédito de metal referente à Análise Química ${analise.numeroAnalise}`,
        grams: analise.auLiquidoParaClienteGramas || 0,
        type: 'CREDIT',
        sourceId: metalCredit.id.toString(), // Link to the MetalCredit
      },
    });
    // --- End of MetalAccount and MetalAccountEntry creation logic ---

    await this.analiseRepository.save(analise);
  }
  }
