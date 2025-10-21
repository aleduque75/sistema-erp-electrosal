import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaMetalCreditRepository } from './repositories/prisma-metal-credit.repository';
import { MetalCreditsController } from './metal-credits.controller';
import { MetalCreditsService } from './metal-credits.service';

@Module({
  imports: [PrismaModule],
  controllers: [MetalCreditsController],
  providers: [
    {
      provide: 'IMetalCreditRepository',
      useClass: PrismaMetalCreditRepository,
    },
    MetalCreditsService,
  ],
  exports: ['IMetalCreditRepository'],
})
export class MetalCreditsModule {}
