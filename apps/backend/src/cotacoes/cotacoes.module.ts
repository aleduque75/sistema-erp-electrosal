import { Module } from '@nestjs/common';
import { CotacoesService } from './cotacoes.service';
import { CotacoesController } from './cotacoes.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CotacoesController],
  providers: [CotacoesService, PrismaService],
  exports: [CotacoesService],
})
export class CotacoesModule {}
