import { Module } from '@nestjs/common';
import { ContasCorrentesService } from './contas-correntes.service';
import { ContasCorrentesController } from './contas-correntes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TransacoesModule } from '../transacoes/transacoes.module';
import { GenerateExtratoPdfUseCase } from './use-cases/generate-extrato-pdf.use-case';

@Module({
  imports: [PrismaModule, TransacoesModule],
  controllers: [ContasCorrentesController],
  providers: [ContasCorrentesService, GenerateExtratoPdfUseCase],
  exports: [ContasCorrentesService],
})
export class ContasCorrentesModule {}
