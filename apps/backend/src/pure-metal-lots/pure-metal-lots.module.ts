import { Module } from '@nestjs/common';
import { PureMetalLotsService } from './pure-metal-lots.service';
import { PureMetalLotsController } from './pure-metal-lots.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PureMetalLotsRepository } from './pure-metal-lots.repository';

@Module({
  controllers: [PureMetalLotsController],
  providers: [PureMetalLotsService, PrismaService, PureMetalLotsRepository],
  exports: [PureMetalLotsService, PureMetalLotsRepository],
})
export class PureMetalLotsModule {}