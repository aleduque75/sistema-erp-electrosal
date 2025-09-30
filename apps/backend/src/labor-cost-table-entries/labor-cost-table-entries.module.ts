import { Module } from '@nestjs/common';
import { LaborCostTableEntriesService } from './labor-cost-table-entries.service';
import { LaborCostTableEntriesController } from './labor-cost-table-entries.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LaborCostTableEntriesController],
  providers: [LaborCostTableEntriesService],
})
export class LaborCostTableEntriesModule {}
