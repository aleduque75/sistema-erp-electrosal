import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';
import { AccountsPayModule } from '../accounts-pay/accounts-pay.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesModule } from '../sales/sales.module';
import { TransacoesModule } from '../transacoes/transacoes.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [ConfigModule, AccountsPayModule, PrismaModule, SalesModule, TransacoesModule, MediaModule],
  controllers: [AutomationsController],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
