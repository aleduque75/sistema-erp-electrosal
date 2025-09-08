import { Module } from '@nestjs/common';
import { JsonImportsController } from './json-imports.controller';
import { JsonImportsService } from './json-imports.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JsonImportsController],
  providers: [JsonImportsService],
})
export class JsonImportsModule {}
