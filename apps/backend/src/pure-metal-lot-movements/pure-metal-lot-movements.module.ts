import { Module } from '@nestjs/common';
import { PureMetalLotMovementsService } from './pure-metal-lot-movements.service';
import { PureMetalLotMovementsController } from './pure-metal-lot-movements.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PureMetalLotMovementsRepository } from './pure-metal-lot-movements.repository';
import { PureMetalLotsRepository } from '../pure-metal-lots/pure-metal-lots.repository';

@Module({
  controllers: [PureMetalLotMovementsController],
  providers: [
    PureMetalLotMovementsService,
    PureMetalLotMovementsRepository,
    PrismaService,
    PureMetalLotsRepository,
  ],
  exports: [PureMetalLotMovementsService, PureMetalLotMovementsRepository],
})
export class PureMetalLotMovementsModule {}
