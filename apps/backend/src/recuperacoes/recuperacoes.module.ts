import { Module } from '@nestjs/common';
import { PrismaRecuperacaoRepository } from './repositories/prisma-recuperacao.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PrismaRecuperacaoRepository],
  exports: [PrismaRecuperacaoRepository],
})
export class RecuperacoesModule {}
