import { Module } from '@nestjs/common';
import { PureMetalLotsService } from './pure-metal-lots.service';
import { PureMetalLotsController } from './pure-metal-lots.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PureMetalLotsController],
  providers: [PureMetalLotsService],
  exports: [PureMetalLotsService], // Export if other modules need to use it
})
export class PureMetalLotsModule {}