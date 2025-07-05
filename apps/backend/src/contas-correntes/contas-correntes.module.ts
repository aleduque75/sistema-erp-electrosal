import { Module } from '@nestjs/common';
import { ContasCorrentesService } from './contas-correntes.service';
import { ContasCorrentesController } from './contas-correntes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TransacoesModule } from '../transacoes/transacoes.module';

@Module({
  imports: [PrismaModule, TransacoesModule],
  controllers: [ContasCorrentesController],
  providers: [ContasCorrentesService],
  exports: [ContasCorrentesService],
})
export class ContasCorrentesModule {}
