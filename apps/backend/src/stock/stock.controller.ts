import { Controller, Post, Body, UseGuards, Req, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdjustStockUseCase } from './use-cases/adjust-stock.use-case';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly adjustStockUseCase: AdjustStockUseCase) {}

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
}
