// apps/backend/src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrismaModule } from '../prisma/prisma.module'; // <--- IMPORTE O PRISMAMODULE AQUI!

@Module({
  imports: [PrismaModule], // <--- Adicione o PrismaModule aqui!
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
