import { Module } from '@nestjs/common';
import { AccountsPayController } from './accounts-pay.controller';
import { AccountsPayService } from './accounts-pay.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { SettingsModule } from '../settings/settings.module';
import { PureMetalLotsModule } from '../pure-metal-lots/pure-metal-lots.module';
import { PureMetalLotMovementsModule } from '../pure-metal-lot-movements/pure-metal-lot-movements.module';

@Module({
  imports: [PrismaModule, CommonModule, SettingsModule, PureMetalLotsModule, PureMetalLotMovementsModule],
  controllers: [AccountsPayController],
  providers: [AccountsPayService],
  exports: [AccountsPayService],
})
export class AccountsPayModule {}
