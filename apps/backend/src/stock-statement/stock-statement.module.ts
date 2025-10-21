import { Module } from '@nestjs/common';
import { StockStatementController } from './stock-statement.controller';
import { StockStatementService } from './stock-statement.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StockStatementController],
  providers: [StockStatementService],
})
export class StockStatementModule {}
