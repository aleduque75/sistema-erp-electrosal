import { Module } from '@nestjs/common';
import { MetalReceivablesController } from './metal-receivables.controller';
import { MetalReceivablesService } from './metal-receivables.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MetalReceivablesController],
  providers: [MetalReceivablesService],
})
export class MetalReceivablesModule {}