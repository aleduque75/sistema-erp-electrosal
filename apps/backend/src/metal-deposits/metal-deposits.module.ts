import { Module } from '@nestjs/common';
import { MetalDepositsController } from './metal-deposits.controller';
import { CreateMetalDepositUseCase } from './use-cases/create-metal-deposit.use-case';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MetalDepositsController],
  providers: [CreateMetalDepositUseCase],
})
export class MetalDepositsModule {}
