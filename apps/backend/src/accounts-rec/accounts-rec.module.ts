import { Module } from '@nestjs/common';
import { AccountsRecController } from './accounts-rec.controller';
import { AccountsRecService } from './accounts-rec.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { SettingsModule } from '../settings/settings.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [PrismaModule, CommonModule, SettingsModule, QuotationsModule, SalesModule],
  controllers: [AccountsRecController],
  providers: [AccountsRecService],
  exports: [AccountsRecService],
})
export class AccountsRecModule {}
