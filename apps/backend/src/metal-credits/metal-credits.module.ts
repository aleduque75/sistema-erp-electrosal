import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaMetalCreditRepository } from './repositories/prisma-metal-credit.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: 'IMetalCreditRepository',
      useClass: PrismaMetalCreditRepository,
    },
  ],
  exports: ['IMetalCreditRepository'],
})
export class MetalCreditsModule {}
