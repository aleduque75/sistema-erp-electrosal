import { Controller, Post, Get, Body, UseGuards, Req, ValidationPipe, Patch, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdjustStockUseCase } from './use-cases/adjust-stock.use-case';
import { ListInventoryLotsUseCase } from './use-cases/list-inventory-lots.use-case';
import { UpdateInventoryLotUseCase } from './use-cases/update-inventory-lot.use-case';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(
    private readonly adjustStockUseCase: AdjustStockUseCase,
    private readonly listInventoryLotsUseCase: ListInventoryLotsUseCase,
    private readonly updateInventoryLotUseCase: UpdateInventoryLotUseCase,
  ) {}

  @Post('adjust')
  async adjustStock(@Body(new ValidationPipe()) dto: AdjustStockDto, @Req() req) {
    const organizationId = req.user?.orgId;
    const command = {
      organizationId,
      productId: dto.productId,
      quantity: dto.quantity,
      costPrice: dto.costPrice,
      batchNumber: dto.batchNumber,
      notes: dto.notes,
    };
    return this.adjustStockUseCase.execute(command);
  }

  @Get('lots')
  async findAll(@Req() req) {
    const organizationId = req.user?.organizationId;
    return this.listInventoryLotsUseCase.execute(organizationId);
  }

  @Patch('lots/:id')
  async update(@Req() req, @Param('id') id: string, @Body() body: any) {
    const organizationId = req.user?.organizationId;
    return this.updateInventoryLotUseCase.execute(organizationId, id, body);
  }
}
