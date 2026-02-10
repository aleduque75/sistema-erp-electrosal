import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StockStatementService } from './stock-statement.service';
import { GetStockStatementDto } from './dtos/get-stock-statement.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('stock-statement')
export class StockStatementController {
  constructor(private readonly stockStatementService: StockStatementService) {}

  @Get()
  getStockStatement(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: GetStockStatementDto,
  ) {
    return this.stockStatementService.getStatement(organizationId, query);
  }
}
