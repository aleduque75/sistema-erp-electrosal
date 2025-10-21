import { Injectable, Logger } from '@nestjs/common';
import { BackfillInstallmentsUseCase } from '../../sales/use-cases/backfill-installments.use-case';
import { SalesService } from '../../sales/sales.service';

@Injectable()
export class RunFullMaintenanceUseCase {
  private readonly logger = new Logger(RunFullMaintenanceUseCase.name);

  constructor(
    private readonly salesService: SalesService,
    private readonly backfillInstallmentsUseCase: BackfillInstallmentsUseCase,
  ) {}

  async execute(organizationId: string) {
    this.logger.log('--- INICIANDO PROCESSO DE MANUTENÇÃO COMPLETA ---');

    try {
      this.logger.log('[PASSO 1/3] Corrigindo e vinculando parcelas de vendas antigas...');
      const installmentsResult = await this.backfillInstallmentsUseCase.execute(organizationId);
      this.logger.log(`[RESULTADO PASSO 1] ${installmentsResult.message}`);

      this.logger.log('[PASSO 2/3] Preenchendo cotações e custos de vendas antigas...');
      await this.salesService.backfillQuotations(organizationId);
      await this.salesService.backfillCosts(organizationId);
      this.logger.log('[RESULTADO PASSO 2] Cotações e custos preenchidos.');

      this.logger.log('[PASSO 3/3] Recalculando todos os ajustes de vendas finalizadas...');
      const adjustmentsResult = await this.salesService.backfillSaleAdjustments(organizationId);
      this.logger.log(`[RESULTADO PASSO 3] ${adjustmentsResult.message}`);

      const finalMessage = 'Processo de manutenção completa finalizado com sucesso!';
      this.logger.log(finalMessage);
      return { message: finalMessage };

    } catch (error) {
      this.logger.error('Ocorreu um erro durante a manutenção completa.', error.stack);
      throw new Error(`Falha na manutenção: ${error.message}`);
    }
  }
}
