import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { SaleStatus, Role } from '@prisma/client'; // Keep Sale for now, will refactor later
import { CreateSaleDto, UpdateSaleDto, ConfirmSaleDto } from './dtos/sales.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSaleUseCase } from './use-cases/create-sale.use-case';
import { ConfirmSaleUseCase } from './use-cases/confirm-sale.use-case';
import { CancelSaleUseCase } from './use-cases/cancel-sale.use-case';
import { FinalizeSaleUseCase } from './use-cases/finalize-sale.use-case';
import { RevertSaleUseCase } from './use-cases/revert-sale.use-case';
import { ReleaseToPcpUseCase } from './use-cases/release-to-pcp.use-case';
import { BackfillSaleGoldValueUseCase } from './use-cases/backfill-sale-gold-value.use-case';
import { ProcessClientMetalPaymentToSupplierUseCase, ProcessClientMetalPaymentToSupplierCommand } from './use-cases/process-client-metal-payment-to-supplier.use-case';

import { Public } from '../auth/decorators/public.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly createSaleUseCase: CreateSaleUseCase,
    private readonly confirmSaleUseCase: ConfirmSaleUseCase,
    private readonly cancelSaleUseCase: CancelSaleUseCase,
    private readonly finalizeSaleUseCase: FinalizeSaleUseCase,
    private readonly revertSaleUseCase: RevertSaleUseCase,
    private readonly releaseToPcpUseCase: ReleaseToPcpUseCase,
    private readonly backfillSaleGoldValueUseCase: BackfillSaleGoldValueUseCase,
    private readonly processClientMetalPaymentToSupplierUseCase: ProcessClientMetalPaymentToSupplierUseCase,
  ) {}

  @Post()
  // @Roles(Role.ADMIN, Role.MANAGER) // Temporarily commented out until RolesGuard is found/implemented
  @UseGuards(AuthGuard('jwt'))
  async create(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Body() createSaleDto: CreateSaleDto,
  ) {
    console.log('POST /api/sales endpoint hit!'); // Debug log
    const sale = await this.createSaleUseCase.execute(organizationId, userId, createSaleDto);
    return sale; // Returning raw sale object as SalePresenter is not found
  }

  @Public()
  @Post('backfill-adjustments')
  async backfillSaleAdjustments() {
    const organizationId = '2a5bb448-056b-4b87-b02f-fec691dd658d'; // Electrosal
    return this.salesService.backfillSaleAdjustments(organizationId);
  }

  @Post('backfill-quotations')
  async backfillQuotations(@CurrentUser('organizationId') organizationId: string) {
    return this.salesService.backfillQuotations(organizationId);
  }

  @Get('diagnose/:orderNumber')
  async diagnoseSale(@CurrentUser('organizationId') organizationId: string, @Param('orderNumber') orderNumber: string) {
    return this.salesService.diagnoseSale(organizationId, Number(orderNumber));
  }

  @Get('by-order-number/:orderNumber/transactions')
  async findByOrderNumberWithTransactions(
    @CurrentUser('organizationId') organizationId: string, 
    @Param('orderNumber') orderNumber: string
  ) {
    return this.salesService.findByOrderNumberWithTransactions(organizationId, Number(orderNumber));
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('limit') limit?: string,
    @Query('status') status?: SaleStatus,
    @Query('orderNumber') orderNumber?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.salesService.findAll(organizationId, {
      limit: limit ? +limit : undefined,
      status,
      orderNumber,
      startDate,
      endDate,
      clientId,
    });
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.salesService.findOne(organizationId, id);
  }

  @Patch(':id/financials')
  async updateFinancials(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() body: { goldPrice?: number; feeAmount?: number },
  ) {
    await this.salesService.updateFinancials(organizationId, id, body);
    return { message: 'Dados financeiros atualizados com sucesso.' };
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.update(organizationId, id, updateSaleDto);
  }

  @Post(':id/confirm')
  async confirm(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') saleId: string,
    @Body() confirmSaleDto: ConfirmSaleDto,
  ) {
    return this.confirmSaleUseCase.execute(organizationId, userId, saleId, confirmSaleDto);
  }

  @Patch(':id/release-to-pcp')
  async releaseToPcp(
    @CurrentUser('organizationId') organizationId: string,
    // @CurrentUser('id') userId: string, // userId is not needed by the use case
    @Param('id') saleId: string,
  ) {
    await this.releaseToPcpUseCase.execute(organizationId, saleId);
    return { message: 'Venda liberada para PCP com sucesso.' };
  }

  @Patch(':id/finalize')
  async finalize(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') saleId: string,
  ) {
    await this.finalizeSaleUseCase.execute(organizationId, saleId);
    return { message: 'Venda finalizada com sucesso.' };
  }
}
