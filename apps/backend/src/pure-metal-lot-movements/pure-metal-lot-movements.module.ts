import { Module } from '@nestjs/common';
import { PureMetalLotMovementsController } from './pure-metal-lot-movements.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PureMetalLotsModule } from '../pure-metal-lots/pure-metal-lots.module';
import { PureMetalLotMovementsRepository } from './repositories/pure-metal-lot-movement.repository';
import { PrismaPureMetalLotMovementsRepository } from './repositories/prisma-pure-metal-lot-movement.repository';
import { CreatePureMetalLotMovementUseCase } from './use-cases/create-pure-metal-lot-movement.use-case';
import { ListPureMetalLotMovementsUseCase } from './use-cases/list-pure-metal-lot-movements.use-case';
import { GetPureMetalLotMovementByIdUseCase } from './use-cases/get-pure-metal-lot-movement-by-id.use-case';
import { UpdatePureMetalLotMovementUseCase } from './use-cases/update-pure-metal-lot-movement.use-case';
import { DeletePureMetalLotMovementUseCase } from './use-cases/delete-pure-metal-lot-movement.use-case';

@Module({
  imports: [PrismaModule, PureMetalLotsModule],
  controllers: [PureMetalLotMovementsController],
  providers: [
    {
      provide: PureMetalLotMovementsRepository,
      useClass: PrismaPureMetalLotMovementsRepository,
    },
    CreatePureMetalLotMovementUseCase,
    ListPureMetalLotMovementsUseCase,
    GetPureMetalLotMovementByIdUseCase,
    UpdatePureMetalLotMovementUseCase,
    DeletePureMetalLotMovementUseCase,
  ],
  exports: [
    PureMetalLotMovementsRepository,
    CreatePureMetalLotMovementUseCase,
    ListPureMetalLotMovementsUseCase,
    GetPureMetalLotMovementByIdUseCase,
    UpdatePureMetalLotMovementUseCase,
    DeletePureMetalLotMovementUseCase,
  ],
})
export class PureMetalLotMovementsModule {}
