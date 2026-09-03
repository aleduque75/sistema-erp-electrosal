import { Module } from '@nestjs/common';
import { PureMetalLotsController } from './pure-metal-lots.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PureMetalLotsRepository } from './repositories/pure-metal-lot.repository';
import { PrismaPureMetalLotsRepository } from './repositories/prisma-pure-metal-lot.repository';
import { CommonModule } from '../common/common.module';
import { CreatePureMetalLotUseCase } from './use-cases/create-pure-metal-lot.use-case';
import { ListPureMetalLotsUseCase } from './use-cases/list-pure-metal-lots.use-case';
import { GetPureMetalLotByIdUseCase } from './use-cases/get-pure-metal-lot-by-id.use-case';
import { UpdatePureMetalLotUseCase } from './use-cases/update-pure-metal-lot.use-case';
import { DeletePureMetalLotUseCase } from './use-cases/delete-pure-metal-lot.use-case';
import { SellPureMetalLotUseCase } from './use-cases/sell-pure-metal-lot.use-case';
import { GerarPdfPureMetalLotUseCase } from './use-cases/gerar-pdf-pure-metal-lot.use-case';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PureMetalLotsController],
  providers: [
    {
      provide: PureMetalLotsRepository,
      useClass: PrismaPureMetalLotsRepository,
    },
    CreatePureMetalLotUseCase,
    ListPureMetalLotsUseCase,
    GetPureMetalLotByIdUseCase,
    UpdatePureMetalLotUseCase,
    DeletePureMetalLotUseCase,
    SellPureMetalLotUseCase,
    GerarPdfPureMetalLotUseCase,
  ],
  exports: [
    PureMetalLotsRepository,
    CreatePureMetalLotUseCase,
    ListPureMetalLotsUseCase,
    GetPureMetalLotByIdUseCase,
    UpdatePureMetalLotUseCase,
    DeletePureMetalLotUseCase,
    SellPureMetalLotUseCase,
    GerarPdfPureMetalLotUseCase,
  ],
})
export class PureMetalLotsModule {}