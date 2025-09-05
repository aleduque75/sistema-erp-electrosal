import { Module } from '@nestjs/common';
import { AccountsRecController } from './accounts-rec.controller';
import { AccountsRecService } from './accounts-rec.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, CommonModule, SettingsModule],
  controllers: [AccountsRecController],
  providers: [AccountsRecService],
  exports: [AccountsRecService],
})
export class AccountsRecModule {}
