import { Module } from '@nestjs/common';
import { ContasContabeisService } from './contas-contabeis.service';
import { ContasContabeisController } from './contas-contabeis.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContasContabeisController],
  providers: [ContasContabeisService],
  exports: [ContasContabeisService],
})
export class ContasContabeisModule {}
