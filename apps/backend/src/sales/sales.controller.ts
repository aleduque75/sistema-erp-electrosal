import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto } from './dtos/sales.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProcessClientMetalPaymentToSupplierUseCase, ProcessClientMetalPaymentToSupplierCommand } from './use-cases/process-client-metal-payment-to-supplier.use-case'; // Import the new use case

@UseGuards(AuthGuard('jwt'))
@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly processClientMetalPaymentToSupplierUseCase: ProcessClientMetalPaymentToSupplierUseCase, // Inject the new use case
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
    return this.salesService.create(organizationId, userId, createSaleDto); // Pass userId
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('limit') limit?: string,
  ) {
    return this.salesService.findAll(organizationId, limit ? +limit : undefined);
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

  @Delete(':id')
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.salesService.remove(organizationId, id);
  }
}
