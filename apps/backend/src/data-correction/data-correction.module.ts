import { Module } from '@nestjs/common';
import { DataCorrectionController } from './data-correction.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DataCorrectionController],
})
export class DataCorrectionModule {}