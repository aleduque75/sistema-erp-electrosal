import { Module } from '@nestjs/common';
import { MetalPaymentsService } from './metal-payments.service';
import { MetalPaymentsController } from './metal-payments.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PureMetalLotsModule } from '../pure-metal-lots/pure-metal-lots.module';
import { PessoaModule } from '../pessoa/pessoa.module';
import { TransacoesModule } from '../transacoes/transacoes.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    PureMetalLotsModule,
    PessoaModule,
    TransacoesModule,
    QuotationsModule,
    SettingsModule,
  ],
  controllers: [MetalPaymentsController],
  providers: [MetalPaymentsService, PrismaService],
  exports: [MetalPaymentsService],
})
export class MetalPaymentsModule {}
