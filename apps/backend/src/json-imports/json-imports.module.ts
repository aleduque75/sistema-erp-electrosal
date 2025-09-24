
import { Module } from '@nestjs/common';
import { JsonImportsService } from './json-imports.service';
import { JsonImportsController } from './json-imports.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [JsonImportsService],
  controllers: [JsonImportsController],
})
export class JsonImportsModule {}
