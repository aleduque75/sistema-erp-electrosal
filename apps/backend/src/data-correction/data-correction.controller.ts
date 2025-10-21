import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CorrectSalesPaymentsDto } from './dtos/correct-sales-payments.dto';
import { CorrectSalesPaymentsUseCase } from './use-cases/correct-sales-payments.use-case';

import { RunFullMaintenanceUseCase } from './use-cases/run-full-maintenance.use-case';
import { InitialStockSetupUseCase } from './use-cases/initial-stock-setup.use-case';
import { InitialStockSetupDto } from './dtos/initial-stock-setup.dto';

@UseGuards(JwtAuthGuard)
@Controller('data-correction')
export class DataCorrectionController {
  constructor(
    private readonly correctSalesPaymentsUseCase: CorrectSalesPaymentsUseCase,
    private readonly runFullMaintenanceUseCase: RunFullMaintenanceUseCase,
    private readonly initialStockSetupUseCase: InitialStockSetupUseCase,
  ) {}

  @Post('initial-stock-setup')
  async initialStockSetup(@Req() req, @Body() dto: InitialStockSetupDto) {
    const organizationId = req.user.organizationId;
    return this.initialStockSetupUseCase.execute(organizationId, dto.tecgalvanoGrams);
  }

  @Post('run-full-maintenance')
  runFullMaintenance(@Req() req) {
    const organizationId = req.user.organizationId;
    return this.runFullMaintenanceUseCase.execute(organizationId);
  }

  @Post('correct-sales-payments')
  correctSalesPayments(@Body() dto: CorrectSalesPaymentsDto, @Req() req) {
    const organizationId = req.user.orgId;
    const command = {
      startOrderNumber: parseInt(dto.startOrderNumber, 10),
      organizationId,
    };
    return this.correctSalesPaymentsUseCase.execute(command);
  }
}
