import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { SaleStatus } from '@prisma/client';
import { CreateSaleDto, UpdateSaleDto, ConfirmSaleDto } from './dtos/sales.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSaleUseCase } from './use-cases/create-sale.use-case';
import { ConfirmSaleUseCase } from './use-cases/confirm-sale.use-case';
import { CancelSaleUseCase } from './use-cases/cancel-sale.use-case';
import { FinalizeSaleUseCase } from './use-cases/finalize-sale.use-case';
import { RevertSaleUseCase } from './use-cases/revert-sale.use-case';
import { ReleaseToPcpUseCase } from './use-cases/release-to-pcp.use-case';
import { ProcessClientMetalPaymentToSupplierUseCase, ProcessClientMetalPaymentToSupplierCommand } from './use-cases/process-client-metal-payment-to-supplier.use-case';

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
    private readonly processClientMetalPaymentToSupplierUseCase: ProcessClientMetalPaymentToSupplierUseCase,
  ) {}

  @Post('client-metal-payment-to-supplier')
  async processClientMetalPaymentToSupplier(
    @CurrentUser('organizationId') organizationId: string,
    @Body() command: ProcessClientMetalPaymentToSupplierCommand,
  ) {
    await this.processClientMetalPaymentToSupplierUseCase.execute({ ...command, organizationId });
    return { message: 'Pagamento de metal do cliente para o fornecedor processado com sucesso.' };
  }

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Body() createSaleDto: CreateSaleDto,
  ) {
    return this.createSaleUseCase.execute(organizationId, userId, createSaleDto);
  }

  @Post(':id/confirm')
  confirm(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() confirmSaleDto: ConfirmSaleDto,
  ) {
    return this.confirmSaleUseCase.execute(organizationId, userId, id, confirmSaleDto);
  }

  @Patch(':id/cancel')
  cancel(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.cancelSaleUseCase.execute(organizationId, id);
  }

  @Patch(':id/finalize')
  finalize(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.finalizeSaleUseCase.execute(organizationId, id);
  }

  @Patch(':id/revert')
  revert(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.revertSaleUseCase.execute(organizationId, id);
  }

  @Patch(':id/release-to-pcp')
  releaseToPcp(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.releaseToPcpUseCase.execute(organizationId, id);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('limit') limit?: string,
    @Query('status') status?: SaleStatus,
    @Query('orderNumber') orderNumber?: string,
  ) {
    return this.salesService.findAll(organizationId, limit ? +limit : undefined, status, orderNumber);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.salesService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.update(organizationId, id, updateSaleDto);
  }
}
