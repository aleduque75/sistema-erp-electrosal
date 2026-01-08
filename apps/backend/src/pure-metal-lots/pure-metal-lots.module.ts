import { Module } from '@nestjs/common';
import { PureMetalLotsService } from './pure-metal-lots.service';
import { PureMetalLotsController } from './pure-metal-lots.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PureMetalLotsRepository } from './pure-metal-lots.repository';
import { GerarPdfPureMetalLotUseCase } from './use-cases/gerar-pdf-pure-metal-lot.use-case';

@Module({
  controllers: [PureMetalLotsController],
  providers: [
    PureMetalLotsService,
    PrismaService,
    PureMetalLotsRepository,
    GerarPdfPureMetalLotUseCase,
  ],
  exports: [PureMetalLotsService, PureMetalLotsRepository],
})
export class PureMetalLotsModule {}